import socket from "../../services/socket";
import { useEffect, useRef, useState } from "react";
import { Eraser, Minus, Plus } from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import { v4 as uuid } from "uuid";
import { Canvas, Rect, Circle, IText, PencilBrush, util, Polyline, ActiveSelection, Line, Triangle, Group } from "fabric";
import { getCanvasOps, saveSnapshot, getSnapshot, } from "../../services/canvasService";

const getAbsoluteCoords = (child) => {
    // getCenterPoint returns absolute world coordinates, naturally including all parent 
    // transforms and bounding box expansions (e.g. strokeWidth).
    const absoluteCenter = child.getCenterPoint();
    
    // translateToGivenOrigin perfectly translates the absolute center back to the specific 
    // origin, automatically accounting for precise object dimensions.
    const absoluteTopLeft = child.translateToGivenOrigin(
        absoluteCenter, 
        'center', 
        'center', 
        child.originX, 
        child.originY
    );

    const matrix = child.calcTransformMatrix();
    const decomposed = util.qrDecompose(matrix);

    return {
        left: absoluteTopLeft.x,
        top: absoluteTopLeft.y,
        scaleX: decomposed.scaleX,
        scaleY: decomposed.scaleY,
        angle: decomposed.angle
    };
};

// ── Helper: build a plain Fabric Line from two endpoints ───────────────────
const buildLineObj = (objectId, x1, y1, x2, y2, style = {}) => {
    return new Line([x1, y1, x2, y2], {
        objectId,
        stroke: style.color || style.stroke || "#000000",
        strokeWidth: style.strokeWidth || 2,
        strokeDashArray: style.strokeDashArray || null,
        opacity: style.opacity !== undefined ? style.opacity : 1,
        fill: "transparent",
        selectable: style.selectable !== undefined ? style.selectable : true,
        evented: style.evented !== undefined ? style.evented : true,
        strokeLineCap: "round",
        hasControls: true,
    });
};

// ── Helper: build an Arrow Group (Line shaft + Triangle arrowhead) ──────────
const buildArrowGroup = (objectId, x1, y1, x2, y2, style = {}) => {
    const strokeColor = style.color || style.stroke || "#000000";
    const strokeWidth = style.strokeWidth || 2;
    const strokeDashArray = style.strokeDashArray || null;
    const opacity = style.opacity !== undefined ? style.opacity : 1;
    const selectable = style.selectable !== undefined ? style.selectable : true;
    const evented = style.evented !== undefined ? style.evented : true;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const headSize = Math.max(12, strokeWidth * 4);

    // Shaft: stop slightly before tip so head sits cleanly
    const len = Math.sqrt(dx * dx + dy * dy);
    const shorten = len > headSize ? headSize * 0.6 : 0;
    const ratio = len > 0 ? (len - shorten) / len : 1;
    const shaftX2 = x1 + dx * ratio;
    const shaftY2 = y1 + dy * ratio;

    const shaft = new Line([x1, y1, shaftX2, shaftY2], {
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
        strokeLineCap: "round",
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
    });

    const head = new Triangle({
        width: headSize,
        height: headSize,
        fill: strokeColor,
        stroke: strokeColor,
        strokeWidth: 0,
        left: x2,
        top: y2,
        originX: "center",
        originY: "center",
        angle: angle + 90,
        selectable: false,
        evented: false,
        objectCaching: false,
    });

    const group = new Group([shaft, head], {
        objectId,
        opacity,
        selectable,
        evented,
        hasControls: true,
        subTargetCheck: false,
        // Store endpoints for serialisation / ops reload
        x1,
        y1,
        x2,
        y2,
        _isArrow: true,
    });

    return group;
};

function CanvasBoard({ roomId, tool, currentStyle, cursors, setHasSelection, }) {
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState(null);

    const containerRef = useRef(null);
    const canvasElementRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const drawingRef = useRef(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const shapeRef = useRef(null);
    const lastCursorEmitRef = useRef(0);
    const currentStrokeIdRef = useRef(null);
    const currentStrokePointsRef = useRef([]);
    const lastPencilEmitRef = useRef(0);
    const lastShapeEmitRef = useRef(0);
    const localActiveObjects = useRef(new Set());
    const styleThrottleTimer = useRef(null);
    const latestSeqRef = useRef(0);
    const toolRef = useRef(tool);
    toolRef.current = tool;
    const styleRef = useRef(currentStyle);
    styleRef.current = currentStyle;
    const currentStrokeStyleRef = useRef(null);
    const manualCheckpointRef = useRef(null);

    const saveBoardSnapshot = async (isManualCheckpoint = false) => {
        try {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            const activeObject = canvas.getActiveObject();
            let canvasData;

            const propsToSave = ["objectId", "selectable", "evented", "hasControls", "rx", "ry", "radius", "strokeDashArray"];
            if (activeObject && activeObject.type && activeObject.type.toLowerCase() === "activeselection") {
                const selectedObjects = activeObject.getObjects();
                canvas.discardActiveObject();
                canvasData = canvas.toObject(propsToSave);
                
                // Re-select the objects seamlessly
                const newSelection = new ActiveSelection(selectedObjects, {
                    canvas: canvas,
                });
                canvas.setActiveObject(newSelection);
                canvas.requestRenderAll();
            } else {
                canvasData = canvas.toObject(propsToSave);
            }

            if (isManualCheckpoint) {
                manualCheckpointRef.current = { canvasData, seq: latestSeqRef.current };
            }

            const snapshotData = {
                canvasData,
                latestSeq: latestSeqRef.current,
                manualCheckpoint: manualCheckpointRef.current
            };
            await saveSnapshot(roomId, snapshotData);
        } catch (error) {
            console.error("Failed to auto-save snapshot:", error);
        }
    };

    useEffect(() => {
        if (!canvasElementRef.current) return;

        const fabricCanvas = new Canvas(
            canvasElementRef.current,
            {
                selection: false,
            }
        );

        fabricCanvasRef.current = fabricCanvas;

        fabricCanvas.on("path:created", (event) => {
            event.path.objectId = currentStrokeIdRef.current || uuid();

            if (currentStrokeStyleRef.current) {
                event.path.set({
                    opacity: currentStrokeStyleRef.current.opacity,
                    stroke: currentStrokeStyleRef.current.strokeColor,
                    strokeWidth: currentStrokeStyleRef.current.strokeWidth,
                    strokeDashArray: currentStrokeStyleRef.current.strokeStyle === "dashed" ? [10, 5] : currentStrokeStyleRef.current.strokeStyle === "dotted" ? [3, 3] : null
                });
            } else {
                event.path.set({
                    opacity: styleRef.current.opacity
                });
            }

            const pathData = event.path.toObject([
                "objectId",
            ]);

            socket.emit("pencil_complete", {
                roomId,
                path: pathData,
            }, (response) => {
                if (response && response.success) {
                    latestSeqRef.current = response.seq;
                    saveBoardSnapshot();
                }
            });
            currentStrokeIdRef.current = null;
            currentStrokePointsRef.current = [];
        });

        const resizeCanvas = () => {
            const container = containerRef.current;

            if (!container) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            if (!width || !height) return;

            fabricCanvas.setDimensions({
                width,
                height,
            });

            if (fabricCanvas.wrapperEl) {
                fabricCanvas.wrapperEl.style.width = `${width}px`;
                fabricCanvas.wrapperEl.style.height = `${height}px`;
            }

            fabricCanvas.calcOffset();
            fabricCanvas.requestRenderAll();
        };

        resizeCanvas();

        const renderReact = () => setHasSelection(s => s); // Force re-render trick
        fabricCanvas.on('mouse:wheel', renderReact);
        fabricCanvas.on('mouse:move', () => { if (fabricCanvas.isDragging) renderReact() });

        const observer = new ResizeObserver(() => {
            resizeCanvas();
        });

        observer.observe(containerRef.current);

        window.addEventListener("resize", resizeCanvas);

        return () => {
            observer.disconnect();
            window.removeEventListener(
                "resize",
                resizeCanvas
            );
            fabricCanvas.dispose();
        };
    }, []);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        if (tool === "pencil") {
            canvas.isDrawingMode = true;

            const brush = new PencilBrush(canvas);
            brush.color = currentStyle.strokeColor;
            brush.width = currentStyle.strokeWidth;
            brush.strokeDashArray = currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null;

            canvas.freeDrawingBrush = brush;
        } else {
            canvas.isDrawingMode = false;
        }
    }, [tool, currentStyle]);

    // NEW EFFECT
    useEffect(() => {
        const handleRemoteDrawing = async (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;

            if (!canvas) return;

            const tempStroke = canvas.getObjects().find(
                (o) => o.objectId === data.path.objectId && o.isTempStroke
            );
            if (tempStroke) canvas.remove(tempStroke);

            try {
                const objects = await util.enlivenObjects([
                    data.path,
                ]);

                if (objects.length > 0) {
                    Object.keys(data.path).forEach(key => {
                        if (objects[0][key] === undefined) {
                            objects[0][key] = data.path[key];
                        }
                    });
                    objects[0].objectId = data.path.objectId;

                    canvas.add(objects[0]);
                    canvas.requestRenderAll();
                }
            } catch (error) {
                console.error(error);
            }
        };

        const handlePencilStream = (data) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            let tempStroke = canvas.getObjects().find(
                (o) => o.objectId === data.objectId && o.isTempStroke
            );

            if (!tempStroke) {
                tempStroke = new Polyline(data.points, {
                    objectId: data.objectId,
                    isTempStroke: true,
                    stroke: data.color,
                    strokeWidth: data.strokeWidth || 3,
                    strokeDashArray: data.strokeDashArray || null,
                    opacity: data.opacity !== undefined ? data.opacity : 1,
                    fill: "transparent",
                    selectable: false,
                    evented: false,
                    strokeLineCap: "round",
                    strokeLineJoin: "round",
                });
                canvas.add(tempStroke);
            } else {
                canvas.remove(tempStroke);
                tempStroke = new Polyline(data.points, {
                    objectId: data.objectId,
                    isTempStroke: true,
                    stroke: data.color,
                    strokeWidth: data.strokeWidth || 3,
                    strokeDashArray: data.strokeDashArray || null,
                    opacity: data.opacity !== undefined ? data.opacity : 1,
                    fill: "transparent",
                    selectable: false,
                    evented: false,
                    strokeLineCap: "round",
                    strokeLineJoin: "round",
                });
                canvas.add(tempStroke);
            }
            canvas.requestRenderAll();
        };

        socket.on("pencil_complete", handleRemoteDrawing);
        socket.on("pencil_stream", handlePencilStream);

        return () => {
            socket.off("pencil_complete", handleRemoteDrawing);
            socket.off("pencil_stream", handlePencilStream);
        };
    }, []);

    useEffect(() => {
        const handleShapeUpdate = (data) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            let obj = canvas.getObjects().find((o) => o.objectId === data.objectId);

            if (!obj) {
                if (data.type === "rect") {
                    obj = new Rect({
                        objectId: data.objectId,
                        left: data.x,
                        top: data.y,
                        width: data.width,
                        height: data.height,
                        fill: data.fill || "transparent",
                        stroke: data.color,
                        strokeWidth: data.strokeWidth || 2,
                        strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity !== undefined ? data.opacity : 1,
                        rx: data.rx || 0,
                        ry: data.ry || 0,
                        selectable: false,
                        evented: false,
                    });
                } else if (data.type === "circle") {
                    obj = new Circle({
                        objectId: data.objectId,
                        left: data.x,
                        top: data.y,
                        radius: data.radius,
                        fill: data.fill || "transparent",
                        stroke: data.color,
                        strokeWidth: data.strokeWidth || 2,
                        strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity !== undefined ? data.opacity : 1,
                        selectable: false,
                        evented: false,
                    });
                } else if (data.type === "line") {
                    obj = buildLineObj(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: false, evented: false,
                    });
                } else if (data.type === "arrow") {
                    obj = buildArrowGroup(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: false, evented: false,
                    });
                }
                if (obj) {
                    canvas.add(obj);
                    obj.setCoords();
                }
            } else {
                if (data.type === "line") {
                    // Re-create line with updated coords for smooth preview
                    canvas.remove(obj);
                    obj = buildLineObj(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: false, evented: false,
                    });
                    canvas.add(obj);
                    obj.setCoords();
                } else if (data.type === "arrow") {
                    // Re-create arrow group with updated coords for smooth preview
                    canvas.remove(obj);
                    obj = buildArrowGroup(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: false, evented: false,
                    });
                    canvas.add(obj);
                    obj.setCoords();
                } else {
                    obj.set({ left: data.x, top: data.y });
                    if (data.color) obj.set({ stroke: data.color });
                    if (data.fill) obj.set({ fill: data.fill });
                    if (data.strokeWidth !== undefined) obj.set({ strokeWidth: data.strokeWidth });
                    if (data.strokeDashArray !== undefined) obj.set({ strokeDashArray: data.strokeDashArray });
                    if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
                    if (data.type === "rect") {
                        obj.set({ width: data.width, height: data.height });
                        if (data.rx !== undefined) obj.set({ rx: data.rx, ry: data.ry });
                    }
                    if (data.type === "circle") {
                        obj.set({ radius: data.radius });
                    }
                    obj.setCoords();
                }
            }
            canvas.requestRenderAll();
        };

        socket.on("shape_update", handleShapeUpdate);

        const handleShape = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            let obj = canvas.getObjects().find(o => o.objectId === data.objectId);
            if (obj) {
                // Line and Arrow use center-based origin in Fabric, so setting
                // left/top to x1/y1 (start point) would shift them. Instead,
                // always remove the preview and rebuild with correct coordinates.
                if (data.type === "line" || data.type === "arrow") {
                    canvas.remove(obj);
                    let finalObj;
                    if (data.type === "line") {
                        finalObj = buildLineObj(
                            data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y,
                            { color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                              opacity: data.opacity, selectable: true, evented: true }
                        );
                    } else {
                        finalObj = buildArrowGroup(
                            data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y,
                            { color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                              opacity: data.opacity, selectable: true, evented: true }
                        );
                    }
                    canvas.add(finalObj);
                    finalObj.setCoords();
                    canvas.requestRenderAll();
                    return;
                }
                obj.set({
                    left: data.x,
                    top: data.y,
                    angle: data.angle || 0,
                    scaleX: data.scaleX || 1,
                    scaleY: data.scaleY || 1,
                    selectable: true,
                    evented: true,
                });
                if (data.color) obj.set({ stroke: data.color });
                if (data.fill) obj.set({ fill: data.fill });
                if (data.strokeWidth !== undefined) obj.set({ strokeWidth: data.strokeWidth });
                if (data.strokeDashArray !== undefined) obj.set({ strokeDashArray: data.strokeDashArray });
                if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
                if (data.type === "rect") {
                    obj.set({ width: data.width, height: data.height });
                    if (data.rx !== undefined) obj.set({ rx: data.rx, ry: data.ry });
                }
                if (data.type === "circle") {
                    obj.set({ radius: data.radius });
                }
                obj.setCoords();
            } else {
                if (data.type === "rect") {
                    canvas.add(
                        new Rect({
                            objectId: data.objectId,
                            left: data.x,
                            top: data.y,
                            width: data.width,
                            height: data.height,
                            height: data.height,
                            angle: data.angle || 0,
                            scaleX: data.scaleX || 1,
                            scaleY: data.scaleY || 1,
                            fill: data.fill || "transparent",
                            stroke: data.color,
                            strokeWidth: data.strokeWidth || 2,
                            strokeDashArray: data.strokeDashArray,
                            opacity: data.opacity !== undefined ? data.opacity : 1,
                            rx: data.rx || 0,
                            ry: data.ry || 0,
                            selectable: true,
                            evented: true,
                        })
                    );
                }

                if (data.type === "line") {
                    const lineObj = buildLineObj(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: true, evented: true,
                    });
                    canvas.add(lineObj);
                    lineObj.setCoords();
                }

                if (data.type === "arrow") {
                    const arrowObj = buildArrowGroup(data.objectId, data.x, data.y, data.x2 ?? data.x, data.y2 ?? data.y, {
                        color: data.color, strokeWidth: data.strokeWidth, strokeDashArray: data.strokeDashArray,
                        opacity: data.opacity, selectable: true, evented: true,
                    });
                    canvas.add(arrowObj);
                    arrowObj.setCoords();
                }

                if (data.type === "circle") {
                    canvas.add(
                        new Circle({
                            objectId: data.objectId,
                            left: data.x,
                            top: data.y,
                            radius: data.radius,
                            radius: data.radius,
                            scaleX: data.scaleX || 1,
                            scaleY: data.scaleY || 1,
                            fill: data.fill || "transparent",
                            stroke: data.color,
                            strokeWidth: data.strokeWidth || 2,
                            strokeDashArray: data.strokeDashArray,
                            opacity: data.opacity !== undefined ? data.opacity : 1,
                            selectable: true,
                            evented: true,
                        })
                    );
                }
            }
            canvas.requestRenderAll();
        };

        const handleText = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            canvas.add(
                new IText(data.text, {
                    objectId: data.objectId,
                    left: data.x,
                    top: data.y,
                    top: data.y,
                    fill: data.color,
                    fontSize: data.fontSize,
                    fontFamily: data.fontFamily || "Inter, sans-serif",
                    fontWeight: data.fontWeight || "normal",
                    fontStyle: data.fontStyle || "normal",
                    underline: data.underline || false,
                    textAlign: data.textAlign || "left",
                    opacity: data.opacity !== undefined ? data.opacity : 1,
                    scaleX: data.scaleX || 1,
                    scaleY: data.scaleY || 1,
                    angle: data.angle || 0,
                    selectable: true,
                    evented: true,
                })
            );
            canvas.requestRenderAll();
        };

        socket.on("shape_complete", handleShape);
        socket.on("text_added", handleText);

        const deleteObjectFromCanvas = (canvas, objectId) => {
            let obj = canvas.getObjects().find((o) => o.objectId === objectId);

            if (!obj) {
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.type && activeObject.type.toLowerCase() === 'activeselection') {
                    obj = activeObject.getObjects().find((o) => o.objectId === objectId);
                    if (obj) {
                        canvas.discardActiveObject();
                        obj = canvas.getObjects().find((o) => o.objectId === objectId);
                    }
                }
            }

            if (obj) {
                if (canvas.getActiveObject() === obj) {
                    canvas.discardActiveObject();
                }
                canvas.remove(obj);
            }
        };

        const handleObjectDelete = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            deleteObjectFromCanvas(canvas, data.objectId);
            canvas.requestRenderAll();
        };

        socket.on("object_delete", handleObjectDelete);


        const handleLiveObjectMove = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            if (localActiveObjects.current.has(data.objectId)) return;

            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find((o) => o.objectId === data.objectId);
            if (!obj) return;

            obj.set({
                left: data.left,
                top: data.top,
                angle: data.angle || 0,
                scaleX: data.scaleX || 1,
                scaleY: data.scaleY || 1,
            });
            if (obj.type === "i-text") {
                if (data.text !== undefined) obj.set({ text: data.text });
                if (data.color !== undefined) obj.set({ fill: data.color });
                if (data.fontSize !== undefined) obj.set({ fontSize: data.fontSize });
                if (data.fontFamily !== undefined) obj.set({ fontFamily: data.fontFamily });
                if (data.fontWeight !== undefined) obj.set({ fontWeight: data.fontWeight });
                if (data.fontStyle !== undefined) obj.set({ fontStyle: data.fontStyle });
                if (data.underline !== undefined) obj.set({ underline: data.underline });
                if (data.textAlign !== undefined) obj.set({ textAlign: data.textAlign });
                if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
            }
            if (obj.type === "rect") {
                if (data.width) obj.set({ width: data.width, height: data.height });
                if (data.rx !== undefined) obj.set({ rx: data.rx, ry: data.ry });
            }
            if (obj.type === "circle") {
                if (data.radius) obj.set({ radius: data.radius });
            }
            if (obj.type !== "i-text") {
                if (data.color) obj.set({ stroke: data.color });
                if (data.fill) obj.set({ fill: data.fill });
                if (data.strokeWidth !== undefined) obj.set({ strokeWidth: data.strokeWidth });
                if (data.strokeDashArray !== undefined) obj.set({ strokeDashArray: data.strokeDashArray });
                if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
            }

            obj.setCoords();
            canvas.requestRenderAll();
        };

        const handleLiveStyleUpdate = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            if (localActiveObjects.current.has(data.objectId)) return;

            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find((o) => o.objectId === data.objectId);
            if (!obj) return;

            if (obj.type === "i-text") {
                if (data.color !== undefined) obj.set({ fill: data.color });
                if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
                if (data.fontFamily !== undefined) obj.set({ fontFamily: data.fontFamily });
                if (data.fontSize !== undefined) obj.set({ fontSize: data.fontSize });
                if (data.textAlign !== undefined) obj.set({ textAlign: data.textAlign });
            } else {
                const isArrow = !!obj._isArrow;
                if (isArrow) {
                    const shaft = obj.getObjects ? obj.getObjects()[0] : null;
                    const head = obj.getObjects ? obj.getObjects()[1] : null;
                    if (data.color) {
                        if (shaft) shaft.set({ stroke: data.color });
                        if (head) head.set({ stroke: data.color, fill: data.color });
                    }
                    if (data.strokeWidth !== undefined) {
                        if (shaft) shaft.set({ strokeWidth: data.strokeWidth });
                        if (head) {
                            const headSize = Math.max(12, data.strokeWidth * 4);
                            head.set({ width: headSize, height: headSize });
                        }
                    }
                    if (data.strokeDashArray !== undefined) {
                        if (shaft) shaft.set({ strokeDashArray: data.strokeDashArray });
                    }
                    if (data.opacity !== undefined) {
                        obj.set({ opacity: data.opacity });
                    }
                    obj.dirty = true;
                } else {
                    if (data.color) obj.set({ stroke: data.color });
                    if (data.fill) obj.set({ fill: data.fill });
                    if (data.strokeWidth !== undefined) obj.set({ strokeWidth: data.strokeWidth });
                    if (data.strokeDashArray !== undefined) obj.set({ strokeDashArray: data.strokeDashArray });
                    if (data.opacity !== undefined) obj.set({ opacity: data.opacity });
                }
            }

            obj.setCoords();
            canvas.requestRenderAll();
        };

        const handleLiveGroupTransform = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            if (!data.objects || !Array.isArray(data.objects)) return;

            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            data.objects.forEach((objData) => {
                const objectId = objData.uuid || objData.objectId;
                if (localActiveObjects.current.has(objectId)) return;

                const obj = canvas.getObjects().find((o) => o.objectId === objectId);
                if (!obj) return;

                obj.set({
                    left: objData.left,
                    top: objData.top,
                    scaleX: objData.scaleX ?? obj.scaleX,
                    scaleY: objData.scaleY ?? obj.scaleY,
                    angle: objData.angle ?? obj.angle,
                });

                if (obj.type === "rect") {
                    if (objData.width !== undefined) obj.set({ width: objData.width, height: objData.height });
                }
                if (obj.type === "circle") {
                    if (objData.radius !== undefined) obj.set({ radius: objData.radius });
                }

                obj.setCoords();
            });

            canvas.requestRenderAll();
        };

        socket.on("object_group_transform_start", handleLiveGroupTransform);
        socket.on("object_group_transform_update", handleLiveGroupTransform);
        socket.on("object_group_transform_end", handleLiveGroupTransform);

        socket.on("object_transform_start", handleLiveObjectMove);
        socket.on("object_transform_update", handleLiveObjectMove);
        socket.on("object_transform_end", handleLiveObjectMove);
        socket.on("object_style_update", handleLiveStyleUpdate);

        const handleTextCreate = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            const textObj = new IText("", {
                objectId: data.objectId,
                left: data.x,
                top: data.y,
                fill: styleRef.current.textColor,
                fontSize: styleRef.current.fontSize,
                fontFamily: styleRef.current.fontFamily,
                textAlign: styleRef.current.textAlign,
                opacity: styleRef.current.textOpacity,
                selectable: true,
                evented: true,
            });
            canvas.add(textObj);
            canvas.requestRenderAll();
        };

        const handleTextEdit = (data) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(o => o.objectId === data.objectId);
            if (obj && obj.type === "i-text") {
                obj.set({ text: data.text });
                canvas.requestRenderAll();
            }
        };

        const handleTextUpdate = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(o => o.objectId === data.objectId);
            if (obj && obj.type === "i-text") {
                obj.set({
                    text: data.text,
                    left: data.left,
                    top: data.top,
                    fill: data.color,
                    fontSize: data.fontSize,
                    fontFamily: data.fontFamily,
                    fontWeight: data.fontWeight,
                    fontStyle: data.fontStyle,
                    underline: data.underline,
                    textAlign: data.textAlign,
                    opacity: data.opacity !== undefined ? data.opacity : 1,
                    scaleX: data.scaleX || 1,
                    scaleY: data.scaleY || 1,
                    angle: data.angle || 0,
                });
                obj.setCoords();
                canvas.requestRenderAll();
            } else if (!obj) {
                // If it doesn't exist, create it
                const textObj = new IText(data.text, {
                    objectId: data.objectId,
                    left: data.left,
                    top: data.top,
                    fill: data.color,
                    fontSize: data.fontSize,
                    fontFamily: data.fontFamily,
                    fontWeight: data.fontWeight,
                    fontStyle: data.fontStyle,
                    underline: data.underline,
                    textAlign: data.textAlign,
                    opacity: data.opacity !== undefined ? data.opacity : 1,
                    scaleX: data.scaleX || 1,
                    scaleY: data.scaleY || 1,
                    angle: data.angle || 0,
                    selectable: true,
                    evented: true,
                });
                canvas.add(textObj);
                canvas.requestRenderAll();
            }
        };

        const handleTextDelete = (data) => {
            if (data.seq && data.seq > latestSeqRef.current) {
                latestSeqRef.current = data.seq;
            }
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            deleteObjectFromCanvas(canvas, data.objectId);
            canvas.requestRenderAll();
        };

        socket.on("text_create", handleTextCreate);
        socket.on("text_edit", handleTextEdit);
        socket.on("text_update", handleTextUpdate);



        socket.on("text_style_update", handleLiveStyleUpdate);
        socket.on("text_delete", handleTextDelete);


        return () => {
            socket.off("shape_update", handleShapeUpdate);
            socket.off("shape_complete", handleShape);
            socket.off("object_delete", handleObjectDelete);
            socket.off("object_group_transform_start", handleLiveGroupTransform);
            socket.off("object_group_transform_update", handleLiveGroupTransform);
            socket.off("object_group_transform_end", handleLiveGroupTransform);
            socket.off("object_transform_start", handleLiveObjectMove);
            socket.off("object_transform_update", handleLiveObjectMove);
            socket.off("object_transform_end", handleLiveObjectMove);
            socket.off("object_style_update", handleLiveStyleUpdate);

            socket.off("text_added", handleText);
            socket.off("text_create", handleTextCreate);
            socket.off("text_edit", handleTextEdit);
            socket.off("text_update", handleTextUpdate);

            socket.off("text_style_update", handleLiveStyleUpdate);
            socket.off("text_delete", handleTextDelete);

        };
    }, []);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        const handleMouseDown = (event) => {
            if (tool === "select") return;
            const point = event.scenePoint;

            if (!point) return;





            if (tool === "text") {
                if (event.target && event.target.type === "i-text") return; // Let user edit existing text

                const textObj = new IText("", {
                    objectId: uuid(),
                    left: point.x,
                    top: point.y,
                    fill: currentStyle.textColor,
                    fontSize: currentStyle.fontSize,
                    fontFamily: currentStyle.fontFamily,
                    textAlign: currentStyle.textAlign,
                    opacity: currentStyle.textOpacity,
                    selectable: true,
                    evented: true,
                });

                canvas.add(textObj);
                canvas.setActiveObject(textObj);
                textObj.enterEditing();
                canvas.requestRenderAll();
                window.dispatchEvent(new CustomEvent("change-tool", { detail: "select" }));

                socket.emit("text_create", {
                    roomId,
                    objectId: textObj.objectId,
                    x: point.x,
                    y: point.y,
                    color: currentStyle.textColor,
                    fontSize: currentStyle.fontSize,
                }, (response) => {
                    if (response && response.success) {
                        latestSeqRef.current = response.seq;
                        saveBoardSnapshot();
                    }
                });
            }
        };

        canvas.on("mouse:down", handleMouseDown);

        return () => {
            canvas.off("mouse:down", handleMouseDown);
        };

    }, [tool, currentStyle, roomId]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        canvas.isDrawingMode = false;
        canvas.selection = false;

        // Ensure the cursor is always clearly visible against the white canvas
        // Matches the standard pointer used by Select, Rect, and Circle tools
        canvas.defaultCursor = "default";
        canvas.freeDrawingCursor = "default";

        canvas.forEachObject((obj) => {
            obj.selectable = false;
            obj.evented = false;
        });

        if (tool === "select") {
            canvas.selection = true;

            canvas.forEachObject((obj) => {
                obj.selectable = true;
                obj.evented = true;
            });


            canvas.renderAll();
        }

        if (tool === "pencil") {
            canvas.isDrawingMode = true;

            const brush = new PencilBrush(canvas);
            brush.color = currentStyle.strokeColor;
            brush.width = currentStyle.strokeWidth;
            brush.strokeDashArray = currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null;

            canvas.freeDrawingBrush = brush;
        }

        canvas.requestRenderAll();
    }, [tool, currentStyle]);

    const loadBoard = async (isManualRestore = false) => {
            try {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                const response = await getSnapshot(roomId);
                let startSeq = 0;

                canvas.clear();
                localActiveObjects.current.clear();
                setHasSelection(false);

                if (response?.snapshot?.dataJson) {
                    const dataJson = response.snapshot.dataJson;
                    
                    if (dataJson.manualCheckpoint) {
                        manualCheckpointRef.current = dataJson.manualCheckpoint;
                    }

                    let canvasData = dataJson;
                    if (isManualRestore && manualCheckpointRef.current) {
                        canvasData = manualCheckpointRef.current.canvasData;
                        startSeq = manualCheckpointRef.current.seq || dataJson.latestSeq || 0;
                    } else if (dataJson.canvasData) {
                        canvasData = dataJson.canvasData;
                        startSeq = dataJson.latestSeq || 0;
                    }
                    
                    latestSeqRef.current = startSeq;
                    await canvas.loadFromJSON(canvasData, (o, object) => {
                        if (!object) return;
                        
                        Object.keys(o).forEach(key => {
                            if (object[key] === undefined) {
                                object[key] = o[key];
                            }
                        });
                        if (o.objectId) {
                            object.objectId = o.objectId;
                        } else if (o.type !== "canvas") {
                            // Backward compatibility: Generate deterministic objectId for legacy snapshots missing it
                            const str = `${o.type}_${o.left}_${o.top}_${o.width}_${o.height}`;
                            let hash = 0;
                            for (let i = 0; i < str.length; i++) {
                                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                                hash = hash & hash;
                            }
                            object.objectId = `legacy_${Math.abs(hash)}`;
                        }
                    });
                }

                const activeTool = toolRef.current;
                canvas.selection = activeTool === "select";
                canvas.forEachObject((obj) => {
                    obj.selectable = activeTool === "select";
                    obj.evented = activeTool === "select";
                });

                if (isManualRestore) {
                    canvas.requestRenderAll();
                    const opData = await getCanvasOps(roomId, startSeq);
                    for (const op of opData.ops) {
                        if (op.seq > latestSeqRef.current) {
                            latestSeqRef.current = op.seq;
                        }
                    }
                    return;
                }

                const data = await getCanvasOps(roomId, startSeq);

                const deletedIds = new Set();
                const movedObjects = new Map();

                for (const op of data.ops) {
                    if (op.seq > latestSeqRef.current) {
                        latestSeqRef.current = op.seq;
                    }
                    if (op.opType === "move") {
                        if (op.payload?.objects && Array.isArray(op.payload.objects)) {
                            for (const objData of op.payload.objects) {
                                const objectId = objData.uuid || objData.objectId;
                                if (!objectId) continue;
                                const prev = movedObjects.get(objectId) || {};
                                movedObjects.set(
                                    objectId,
                                    {
                                        ...prev,
                                        left: objData.left ?? prev.left,
                                        top: objData.top ?? prev.top,
                                        scaleX: objData.scaleX ?? prev.scaleX,
                                        scaleY: objData.scaleY ?? prev.scaleY,
                                        angle: objData.angle ?? prev.angle,
                                        width: objData.width ?? prev.width,
                                        height: objData.height ?? prev.height,
                                    }
                                );
                            }
                        } else if (op.payload?.objectId) {
                            const prev = movedObjects.get(op.payload.objectId) || {};
                            movedObjects.set(
                                op.payload.objectId,
                                {
                                    ...prev,
                                    left: op.payload.left ?? prev.left,
                                    top: op.payload.top ?? prev.top,
                                    width: op.payload.width ?? prev.width,
                                    height: op.payload.height ?? prev.height,
                                    radius: op.payload.radius ?? prev.radius,
                                    fontSize: op.payload.fontSize ?? prev.fontSize,
                                    scaleX: op.payload.scaleX ?? prev.scaleX,
                                    scaleY: op.payload.scaleY ?? prev.scaleY,
                                    angle: op.payload.angle ?? prev.angle,
                                    color: op.payload.color || op.payload.fill || prev.color,
                                    text: op.payload.text ?? prev.text,
                                    fontFamily: op.payload.fontFamily ?? prev.fontFamily,
                                    fontWeight: op.payload.fontWeight ?? prev.fontWeight,
                                    fontStyle: op.payload.fontStyle ?? prev.fontStyle,
                                    underline: op.payload.underline ?? prev.underline,
                                    textAlign: op.payload.textAlign ?? prev.textAlign,
                                    opacity: op.payload.opacity ?? prev.opacity,
                                    strokeWidth: op.payload.strokeWidth ?? prev.strokeWidth,
                                    strokeDashArray: op.payload.strokeDashArray ?? prev.strokeDashArray,
                                    rx: op.payload.rx ?? prev.rx,
                                    ry: op.payload.ry ?? prev.ry,
                                }
                            );
                        }
                    }
                }

                for (const op of data.ops) {
                    if (
                        op.opType === "delete" &&
                        op.payload?.objectId
                    ) {
                        deletedIds.add(op.payload?.objectId);
                    }
                }

                for (const op of data.ops) {
                    if (deletedIds.has(op.payload?.objectId)) {
                        continue;
                    }

                    const existingObj = canvas.getObjects().find(o => o.objectId === op.payload?.objectId);

                    if (op.opType === "freehand") {
                        if (existingObj) {
                            const moved = movedObjects.get(op.payload?.objectId);
                            if (moved) {
                                existingObj.set({
                                    left: moved.left ?? existingObj.left,
                                    top: moved.top ?? existingObj.top,
                                    scaleX: moved.scaleX ?? existingObj.scaleX,
                                    scaleY: moved.scaleY ?? existingObj.scaleY,
                                    angle: moved.angle ?? existingObj.angle,
                                    stroke: moved.color ?? existingObj.stroke,
                                    strokeWidth: moved.strokeWidth ?? existingObj.strokeWidth,
                                    strokeDashArray: moved.strokeDashArray ?? existingObj.strokeDashArray,
                                    opacity: moved.opacity ?? existingObj.opacity,
                                });
                                existingObj.setCoords();
                            }
                        } else {
                            try {
                                const objects = await util.enlivenObjects([
                                    op.payload.path,
                                ]);

                                if (objects.length > 0) {
                                    Object.keys(op.payload.path).forEach(key => {
                                        if (objects[0][key] === undefined) {
                                            objects[0][key] = op.payload.path[key];
                                        }
                                    });
                                    objects[0].objectId = op.payload.objectId;

                                    const moved = movedObjects.get(op.payload?.objectId);

                                    if (moved) {
                                        objects[0].set({
                                            left: moved.left ?? objects[0].left,
                                            top: moved.top ?? objects[0].top,
                                            scaleX: moved.scaleX ?? 1,
                                            scaleY: moved.scaleY ?? 1,
                                            angle: moved.angle ?? 0,
                                            stroke: moved.color ?? objects[0].stroke,
                                            strokeWidth: moved.strokeWidth ?? objects[0].strokeWidth,
                                            strokeDashArray: moved.strokeDashArray ?? objects[0].strokeDashArray,
                                            opacity: moved.opacity ?? objects[0].opacity,
                                        });
                                        objects[0].setCoords();
                                    }

                                    canvas.add(objects[0]);
                                }
                            } catch (e) {
                                console.error("Failed to enliven freehand path:", e);
                            }
                        }
                    }

                    if (op.opType === "shape") {
                        if (existingObj) {
                            const moved = movedObjects.get(op.payload?.objectId);
                            if (moved) {
                                existingObj.set({
                                    left: moved.left ?? existingObj.left,
                                    top: moved.top ?? existingObj.top,
                                    angle: moved.angle ?? existingObj.angle,
                                    scaleX: moved.scaleX ?? existingObj.scaleX,
                                    scaleY: moved.scaleY ?? existingObj.scaleY,
                                    stroke: moved.color ?? existingObj.stroke,
                                    fill: moved.fill ?? existingObj.fill,
                                    strokeWidth: moved.strokeWidth ?? existingObj.strokeWidth,
                                    strokeDashArray: moved.strokeDashArray ?? existingObj.strokeDashArray,
                                    opacity: moved.opacity ?? existingObj.opacity,
                                });
                                if (existingObj.type === "rect") {
                                    existingObj.set({
                                        width: moved.width ?? existingObj.width,
                                        height: moved.height ?? existingObj.height,
                                        rx: moved.rx ?? existingObj.rx,
                                        ry: moved.ry ?? existingObj.ry,
                                    });
                                }
                                if (existingObj.type === "circle" && moved.radius) {
                                    existingObj.set({
                                        radius: moved.radius ?? existingObj.radius,
                                    });
                                }
                                existingObj.setCoords();
                            }
                        } else {
                            const moved = movedObjects.get(op.payload?.objectId);
                            if (op.payload.type === "rect") {
                                canvas.add(
                                    new Rect({
                                        objectId: op.payload?.objectId,
                                        left: moved ? moved.left : op.payload.x,
                                        top: moved ? moved.top : op.payload.y,
                                        width: moved?.width || op.payload.width,
                                        height: moved?.height || op.payload.height,
                                        fill: "transparent",
                                        stroke: moved?.color ?? op.payload.color,
                                        strokeWidth: 2,
                                        selectable: true,
                                        evented: true,
                                        angle: moved?.angle || 0,
                                        scaleX: moved?.scaleX ?? 1,
                                        scaleY: moved?.scaleY ?? 1,
                                    })
                                );
                            }

                            if (op.payload.type === "circle") {
                                canvas.add(
                                    new Circle({
                                        objectId: op.payload?.objectId,
                                        left: moved ? moved.left : op.payload.x,
                                        top: moved ? moved.top : op.payload.y,
                                        radius: moved?.radius || op.payload.radius || 50,
                                        fill: "transparent",
                                        stroke: moved?.color ?? op.payload.color,
                                        strokeWidth: op.payload.strokeWidth || 2,
                                        strokeDashArray: op.payload.strokeDashArray || null,
                                        opacity: op.payload.opacity !== undefined ? op.payload.opacity : 1,
                                        selectable: true,
                                        evented: true,
                                        angle: moved?.angle || 0,
                                        scaleX: moved?.scaleX ?? 1,
                                        scaleY: moved?.scaleY ?? 1,
                                    })
                                );
                            }

                            if (op.payload.type === "line") {
                                const lx1 = moved?.left ?? op.payload.x;
                                const ly1 = moved?.top ?? op.payload.y;
                                const lx2 = op.payload.x2 ?? lx1;
                                const ly2 = op.payload.y2 ?? ly1;
                                canvas.add(buildLineObj(op.payload.objectId, lx1, ly1, lx2, ly2, {
                                    color: moved?.color ?? op.payload.color,
                                    strokeWidth: op.payload.strokeWidth || 2,
                                    strokeDashArray: op.payload.strokeDashArray || null,
                                    opacity: op.payload.opacity !== undefined ? op.payload.opacity : 1,
                                    selectable: true,
                                    evented: true,
                                }));
                            }

                            if (op.payload.type === "arrow") {
                                const ax1 = moved?.left ?? op.payload.x;
                                const ay1 = moved?.top ?? op.payload.y;
                                const ax2 = op.payload.x2 ?? ax1;
                                const ay2 = op.payload.y2 ?? ay1;
                                canvas.add(buildArrowGroup(op.payload.objectId, ax1, ay1, ax2, ay2, {
                                    color: moved?.color ?? op.payload.color,
                                    strokeWidth: op.payload.strokeWidth || 2,
                                    strokeDashArray: op.payload.strokeDashArray || null,
                                    opacity: op.payload.opacity !== undefined ? op.payload.opacity : 1,
                                    selectable: true,
                                    evented: true,
                                }));
                            }
                        }
                    }

                    if (op.opType === "text") {
                        if (existingObj) {
                            const moved = movedObjects.get(op.payload?.objectId);
                            if (moved) {
                                existingObj.set({
                                    text: moved.text ?? existingObj.text,
                                    left: moved.left ?? existingObj.left,
                                    top: moved.top ?? existingObj.top,
                                    fill: moved.color ?? existingObj.fill,
                                    fontSize: moved.fontSize ?? existingObj.fontSize,
                                    fontFamily: moved.fontFamily ?? existingObj.fontFamily,
                                    fontWeight: moved.fontWeight ?? existingObj.fontWeight,
                                    fontStyle: moved.fontStyle ?? existingObj.fontStyle,
                                    underline: moved.underline ?? existingObj.underline,
                                    textAlign: moved.textAlign ?? existingObj.textAlign,
                                    angle: moved.angle ?? existingObj.angle,
                                    scaleX: moved.scaleX ?? existingObj.scaleX,
                                    scaleY: moved.scaleY ?? existingObj.scaleY,
                                    opacity: moved.opacity ?? existingObj.opacity,
                                });
                                existingObj.setCoords();
                            }
                        } else {
                            const moved = movedObjects.get(op.payload?.objectId);
                            canvas.add(
                                new IText(moved?.text ?? op.payload.text, {
                                    objectId: op.payload.objectId,
                                    left: moved ? moved.left : op.payload.x,
                                    top: moved ? moved.top : op.payload.y,
                                    fill: moved?.color ?? op.payload.color,
                                    fontSize: moved?.fontSize ?? op.payload.fontSize,
                                    fontFamily: moved?.fontFamily ?? op.payload.fontFamily,
                                    fontWeight: moved?.fontWeight ?? op.payload.fontWeight,
                                    fontStyle: moved?.fontStyle ?? op.payload.fontStyle,
                                    underline: moved?.underline ?? op.payload.underline,
                                    textAlign: moved?.textAlign ?? op.payload.textAlign,
                                    angle: moved?.angle ?? 0,
                                    scaleX: moved?.scaleX ?? 1,
                                    scaleY: moved?.scaleY ?? 1,
                                    selectable: true,
                                    evented: true,
                                })
                            );
                        }
                    }
                }

                // Remove deleted objects loaded from snapshot
                for (const objectId of deletedIds) {
                    const obj = canvas.getObjects().find(o => o.objectId === objectId);
                    if (obj) {
                        canvas.remove(obj);
                    }
                }

                // Apply remaining moved coordinates to existing objects (e.g. loaded from snapshot)
                for (const [objectId, moved] of movedObjects.entries()) {
                    const existingObj = canvas.getObjects().find(o => o.objectId === objectId);
                    if (existingObj) {
                        existingObj.set({
                            left: moved.left ?? existingObj.left,
                            top: moved.top ?? existingObj.top,
                            scaleX: moved.scaleX ?? existingObj.scaleX,
                            scaleY: moved.scaleY ?? existingObj.scaleY,
                            angle: moved.angle ?? existingObj.angle,
                        });
                        if (existingObj.type !== "i-text") {
                            existingObj.set({
                                stroke: moved.color ?? existingObj.stroke,
                                fill: moved.fill ?? existingObj.fill,
                                strokeWidth: moved.strokeWidth ?? existingObj.strokeWidth,
                                strokeDashArray: moved.strokeDashArray ?? existingObj.strokeDashArray,
                                opacity: moved.opacity ?? existingObj.opacity,
                            });
                        }
                        if (existingObj.type === "rect") {
                            if (moved.width !== undefined) existingObj.set({ width: moved.width, height: moved.height });
                            if (moved.rx !== undefined) existingObj.set({ rx: moved.rx, ry: moved.ry });
                        }
                        if (existingObj.type === "circle") {
                            if (moved.radius !== undefined) existingObj.set({ radius: moved.radius });
                        }
                        existingObj.setCoords();
                    }
                }

                // Set selectability according to current tool
                const currentTool = toolRef.current;
                canvas.forEachObject((obj) => {
                    obj.selectable = (currentTool === "select");
                    obj.evented = (currentTool === "select");
                });

                canvas.requestRenderAll();
            } catch (error) {
                console.error("Error loading board:", error);
            } finally {
                setLoading(false);
            }
    };

    useEffect(() => {
        loadBoard();
    }, [roomId]);

    useEffect(() => {
        const handleRemove = async () => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            const activeObjects = canvas.getActiveObjects();
            if (!activeObjects || activeObjects.length === 0) return;

            // Discard active selection so objects are returned to canvas._objects before removal
            canvas.discardActiveObject();

            const emitPromises = activeObjects.map((obj) => {
                return new Promise((resolve) => {
                    if (obj.objectId) {
                        const eventName = obj.type === "i-text" ? "text_delete" : "object_delete";
                        socket.emit(eventName, {
                            roomId,
                            objectId: obj.objectId,
                        }, (response) => {
                            if (response && response.success) {
                                if (response.seq && response.seq > latestSeqRef.current) {
                                    latestSeqRef.current = response.seq;
                                }
                            }
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });

            activeObjects.forEach((obj) => {
                canvas.remove(obj);
            });

            canvas.requestRenderAll();

            await Promise.all(emitPromises);
            saveBoardSnapshot();
        };

        const handleKeyDown = (e) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                // Ensure we aren't typing in an external input (like chat)
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;

                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                // Ensure we aren't editing a text box inside the canvas
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.isEditing) return;

                handleRemove();
            }
        };

        window.addEventListener("remove-selected-shape", handleRemove);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("remove-selected-shape", handleRemove);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [roomId]);
    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        const handleSelected = () => {
            setHasSelection(true);
            const activeObj = canvas.getActiveObject();
            if (activeObj) {
                if (activeObj.type && activeObj.type.toLowerCase() === "activeselection") {
                    activeObj.set({
                        borderColor: '#3b82f6',
                        borderScaleFactor: 2,
                        padding: 4,
                    });
                    canvas.requestRenderAll();

                    const objects = activeObj.getObjects();
                    const hasText = objects.some(o => o.type === "i-text");
                    const hasShape = objects.some(o => o.type !== "i-text");
                    const rep = objects[0] || {};
                    const isText = rep.type === "i-text";

                    window.dispatchEvent(new CustomEvent("selection-info-updated", {
                        detail: {
                            isMultiple: true,
                            hasText,
                            hasShape,
                            strokeColor: rep.stroke || "#000000",
                            backgroundColor: rep.fill || "transparent",
                            strokeWidth: rep.strokeWidth || 3,
                            opacity: rep.opacity ?? 1,
                            textColor: isText ? rep.fill : "#000000",
                            fontFamily: rep.fontFamily || "Inter, sans-serif",
                            fontSize: rep.fontSize || 24,
                            textAlign: rep.textAlign || "left",
                            textOpacity: isText ? (rep.opacity ?? 1) : 1,
                            edgeStyle: rep.rx ? "round" : "sharp",
                            strokeStyle: rep.strokeDashArray ? (rep.strokeDashArray[0] > 5 ? "dashed" : "dotted") : "solid"
                        }
                    }));
                } else {
                    const isText = activeObj.type === "i-text";
                    const isArrow = !!activeObj._isArrow;
                    const shaft = isArrow && activeObj.getObjects ? activeObj.getObjects()[0] : null;
                    window.dispatchEvent(new CustomEvent("selection-info-updated", {
                        detail: {
                            isMultiple: false,
                            isText,
                            type: isArrow ? "arrow" : activeObj.type,
                            strokeColor: isArrow ? (shaft?.stroke || "#000000") : (activeObj.stroke || "#000000"),
                            backgroundColor: isArrow ? "transparent" : (activeObj.fill || "transparent"),
                            strokeWidth: isArrow ? (shaft?.strokeWidth || 3) : (activeObj.strokeWidth || 3),
                            opacity: activeObj.opacity ?? 1,
                            textColor: isText ? activeObj.fill : "#000000",
                            fontFamily: activeObj.fontFamily || "Inter, sans-serif",
                            fontSize: activeObj.fontSize || 24,
                            textAlign: activeObj.textAlign || "left",
                            textOpacity: isText ? (activeObj.opacity ?? 1) : 1,
                            edgeStyle: activeObj.rx ? "round" : "sharp",
                            strokeStyle: isArrow
                                ? (shaft?.strokeDashArray ? (shaft.strokeDashArray[0] > 5 ? "dashed" : "dotted") : "solid")
                                : (activeObj.strokeDashArray ? (activeObj.strokeDashArray[0] > 5 ? "dashed" : "dotted") : "solid")
                        }
                    }));
                }
            }
        };

        const handleCleared = () => {
            setHasSelection(false);
        };

        canvas.on("selection:created", handleSelected);
        canvas.on("selection:updated", handleSelected);
        canvas.on("selection:cleared", handleCleared);

        const handleStyleUpdate = (e) => {
            const { property, value, isFinal } = e.detail;
            const activeObjects = canvas.getActiveObjects();
            if (!activeObjects || activeObjects.length === 0) return;

            activeObjects.forEach(obj => {
                const isText = obj.type === "i-text";
                if (isText) {
                    if (property === "textColor") obj.set({ fill: value });
                    if (property === "fontFamily") obj.set({ fontFamily: value });
                    if (property === "fontSize") obj.set({ fontSize: value });
                    if (property === "textAlign") obj.set({ textAlign: value });
                    if (property === "textOpacity") obj.set({ opacity: value });
                } else {
                    const isArrow = !!obj._isArrow;
                    if (isArrow) {
                        const shaft = obj.getObjects ? obj.getObjects()[0] : null;
                        const head = obj.getObjects ? obj.getObjects()[1] : null;
                        if (property === "strokeColor") {
                            if (shaft) shaft.set({ stroke: value });
                            if (head) head.set({ stroke: value, fill: value });
                        }
                        if (property === "strokeWidth") {
                            if (shaft) shaft.set({ strokeWidth: value });
                            if (head) {
                                const headSize = Math.max(12, value * 4);
                                head.set({ width: headSize, height: headSize });
                            }
                        }
                        if (property === "opacity") {
                            obj.set({ opacity: value });
                        }
                        if (property === "strokeStyle") {
                            const dashArray = value === "dashed" ? [10, 5] : value === "dotted" ? [3, 3] : null;
                            if (shaft) shaft.set({ strokeDashArray: dashArray });
                        }
                        obj.dirty = true;
                    } else {
                        if (property === "strokeColor") obj.set({ stroke: value });
                        if (property === "backgroundColor") obj.set({ fill: value });
                        if (property === "strokeWidth") obj.set({ strokeWidth: value });
                        if (property === "opacity") obj.set({ opacity: value });
                        if (property === "edgeStyle" && obj.type === "rect") {
                            obj.set({ rx: value === "round" ? 10 : 0, ry: value === "round" ? 10 : 0 });
                        }
                        if (property === "strokeStyle") {
                            obj.set({ strokeDashArray: value === "dashed" ? [10, 5] : value === "dotted" ? [3, 3] : null });
                        }
                    }
                }
                obj.setCoords();
            });
            canvas.requestRenderAll();

            activeObjects.forEach(obj => {
                const isText = obj.type === "i-text";
                const eventName = isText ? "text_style_update" : "object_style_update";

                const absCoords = getAbsoluteCoords(obj);
                const payload = {
                    roomId,
                    objectId: obj.objectId || obj.uuid,
                    final: isFinal
                };

                if (isText) {
                    Object.assign(payload, {
                        color: obj.fill,
                        opacity: obj.opacity,
                        fontFamily: obj.fontFamily,
                        fontSize: obj.fontSize,
                        textAlign: obj.textAlign
                    });
                } else {
                    const isArrow = !!obj._isArrow;
                    if (isArrow) {
                        const shaft = obj.getObjects ? obj.getObjects()[0] : null;
                        Object.assign(payload, {
                            color: shaft ? shaft.stroke : "#000000",
                            fill: "transparent",
                            strokeWidth: shaft ? shaft.strokeWidth : 2,
                            strokeDashArray: shaft ? shaft.strokeDashArray : null,
                            opacity: obj.opacity
                        });
                    } else {
                        Object.assign(payload, {
                            color: obj.stroke,
                            fill: obj.fill,
                            strokeWidth: obj.strokeWidth,
                            strokeDashArray: obj.strokeDashArray,
                            opacity: obj.opacity
                        });
                    }
                }

                socket.emit(eventName, payload);
            });

            if (isFinal) {
                saveBoardSnapshot();
            }
        };

        window.addEventListener("update-selected-style", handleStyleUpdate);

        let throttleTimers = {};
        let latestPayloads = {};
        let saveSnapshotTimer = null;

        const debouncedSaveSnapshot = () => {
            if (saveSnapshotTimer) clearTimeout(saveSnapshotTimer);
            saveSnapshotTimer = setTimeout(() => saveBoardSnapshot(), 200);
        };

        const emitLiveTransform = (obj, eventName, isFinal = false) => {
            if (!obj || !obj.type) return;
            if (obj.type.toLowerCase() === "activeselection") return;
            const payload = {
                roomId,
                objectId: obj.objectId,
                left: obj.left,
                top: obj.top,
                width: obj.width,
                height: obj.height,
                radius: obj.radius,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                final: isFinal,
                color: obj.type === "i-text" ? obj.fill : obj.stroke,
                fill: obj.fill,
                strokeWidth: obj.strokeWidth,
                strokeDashArray: obj.strokeDashArray,
                opacity: obj.opacity,
                rx: obj.rx,
                ry: obj.ry
            };

            if (eventName === "object_transform_start") {
                socket.emit(eventName, payload);
            } else if (isFinal) {
                if (throttleTimers[obj.objectId]) {
                    clearTimeout(throttleTimers[obj.objectId]);
                    delete throttleTimers[obj.objectId];
                }
                socket.emit(eventName, payload, (response) => {
                    if (response && response.success) {
                        if (response.seq > latestSeqRef.current) latestSeqRef.current = response.seq;
                        debouncedSaveSnapshot();
                    }
                });
            } else if (eventName === "object_transform_update") {
                latestPayloads[obj.objectId] = payload;
                if (!throttleTimers[obj.objectId]) {
                    throttleTimers[obj.objectId] = setTimeout(() => {
                        socket.emit(eventName, latestPayloads[obj.objectId]);
                        delete throttleTimers[obj.objectId];
                    }, 33);
                }
            }
        };

        const emitGroupChildren = (group, eventName, isFinal = false) => {
            group.getObjects().forEach(child => {
                const absCoords = getAbsoluteCoords(child);
                emitLiveTransform({
                    objectId: child.objectId,
                    type: child.type,
                    left: absCoords.left,
                    top: absCoords.top,
                    width: child.width,
                    height: child.height,
                    radius: child.radius,
                    scaleX: absCoords.scaleX,
                    scaleY: absCoords.scaleY,
                    angle: absCoords.angle,
                    fill: child.fill,
                    stroke: child.stroke,
                    strokeWidth: child.strokeWidth,
                    strokeDashArray: child.strokeDashArray,
                    opacity: child.opacity,
                    rx: child.rx,
                    ry: child.ry
                }, eventName, isFinal);
            });
        };

        canvas.on("mouse:down", (e) => {
            if (e.target) {
                if (e.target.type && e.target.type.toLowerCase() === "activeselection") {
                    e.target.getObjects().forEach(child => {
                        if (child.objectId) localActiveObjects.current.add(child.objectId);
                    });
                } else if (e.target.objectId) {
                    localActiveObjects.current.add(e.target.objectId);
                }
            }
        });

        canvas.on("mouse:up", (e) => {
            if (e.target) {
                if (e.target.type && e.target.type.toLowerCase() === "activeselection") {
                    const objectIds = e.target.getObjects().map(c => c.objectId).filter(Boolean);
                    setTimeout(() => {
                        objectIds.forEach(id => localActiveObjects.current.delete(id));
                    }, 100);
                } else if (e.target.objectId) {
                    // Keep lock for a fraction of a second to prevent incoming old updates from overriding
                    setTimeout(() => localActiveObjects.current.delete(e.target.objectId), 100);
                }
            }
        });

        canvas.on("selection:cleared", () => {
            localActiveObjects.current.clear();
        });

        const handleTransformEvent = (target, eventName, isFinal = false) => {
            if (!target || !target.type) return;
            if (target.type.toLowerCase() === "activeselection") {
                emitGroupChildren(target, eventName, isFinal);
            } else if (target.objectId) {
                emitLiveTransform(target, eventName, isFinal);
            }
        };

        canvas.on("before:transform", (e) => {
            handleTransformEvent(e.transform?.target || e.target, "object_transform_start");
        });

        canvas.on("object:moving", (e) => handleTransformEvent(e.target, "object_transform_update"));
        canvas.on("object:scaling", (e) => handleTransformEvent(e.target, "object_transform_update"));
        canvas.on("object:rotating", (e) => handleTransformEvent(e.target, "object_transform_update"));
        
        canvas.on("object:modified", (e) => {
            handleTransformEvent(e.target, "object_transform_end", true);
        });


        let textThrottleTimer = null;
        const handleTextChanged = (e) => {
            if (!e.target || e.target.type !== "i-text") return;
            if (!textThrottleTimer) {
                textThrottleTimer = setTimeout(() => {
                    socket.emit("text_edit", {
                        roomId,
                        objectId: e.target.objectId,
                        text: e.target.text,
                    });
                    textThrottleTimer = null;
                }, 33);
            }
        };

        const handleTextEditingExited = (e) => {
            if (!e.target || e.target.type !== "i-text") return;
            socket.emit("text_update", {
                final: true,
                roomId,
                objectId: e.target.objectId,
                text: e.target.text,
                left: e.target.left,
                top: e.target.top,
                color: e.target.fill,
                fontSize: e.target.fontSize,
                fontFamily: e.target.fontFamily,
                fontWeight: e.target.fontWeight,
                fontStyle: e.target.fontStyle,
                underline: e.target.underline,
                textAlign: e.target.textAlign,
                scaleX: e.target.scaleX || 1,
                scaleY: e.target.scaleY || 1,
                angle: e.target.angle || 0,
                opacity: e.target.opacity !== undefined ? e.target.opacity : 1,
            }, (response) => {
                if (response && response.success) {
                    latestSeqRef.current = response.seq;
                    saveBoardSnapshot();
                }
            });
        };

        canvas.on("text:changed", handleTextChanged);
        canvas.on("text:editing:exited", handleTextEditingExited);



        return () => {
            canvas.off("selection:created", handleSelected);
            canvas.off("selection:updated", handleSelected);
            canvas.off("selection:cleared", handleCleared);
            canvas.off("text:changed", handleTextChanged);
            canvas.off("text:editing:exited", handleTextEditingExited);
            canvas.off("before:transform");
            canvas.off("object:moving");
            canvas.off("object:scaling");
            canvas.off("object:rotating");
            canvas.off("object:modified");
            window.removeEventListener("update-selected-style", handleStyleUpdate);
        };
    }, [setHasSelection]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        const handleMouseDown = (event) => {
            if (tool === "select") return;
            const point = event.scenePoint;

            if (!point) return;

            if (tool === "pencil" && canvas.isDrawingMode) {
                currentStrokeIdRef.current = uuid();
                currentStrokePointsRef.current = [point];
                currentStrokeStyleRef.current = { ...currentStyle };

                socket.emit("pencil_start", {
                    roomId,
                    objectId: currentStrokeIdRef.current,
                    x: point.x,
                    y: point.y,
                    color: currentStrokeStyleRef.current.strokeColor,
                    strokeWidth: currentStrokeStyleRef.current.strokeWidth,
                    strokeDashArray: currentStrokeStyleRef.current.strokeStyle === "dashed" ? [10, 5] : currentStrokeStyleRef.current.strokeStyle === "dotted" ? [3, 3] : null,
                    opacity: currentStrokeStyleRef.current.opacity
                });
                return;
            }

            if (tool !== "rect" && tool !== "circle" && tool !== "line" && tool !== "arrow") return;

            if (event.target) return;

            drawingRef.current = true;
            startXRef.current = point.x;
            startYRef.current = point.y;

            let shape;

            if (tool === "rect") {
                shape = new Rect({
                    objectId: uuid(),
                    left: point.x,
                    top: point.y,
                    width: 0,
                    height: 0,
                    fill: currentStyle.backgroundColor,
                    stroke: currentStyle.strokeColor,
                    strokeWidth: currentStyle.strokeWidth,
                    strokeDashArray: currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null,
                    opacity: currentStyle.opacity,
                    rx: currentStyle.edgeStyle === "round" ? 10 : 0,
                    ry: currentStyle.edgeStyle === "round" ? 10 : 0,
                    selectable: true,
                    evented: true,
                });
            } else if (tool === "circle") {
                shape = new Circle({
                    objectId: uuid(),
                    left: point.x,
                    top: point.y,
                    radius: 1,
                    fill: currentStyle.backgroundColor,
                    stroke: currentStyle.strokeColor,
                    strokeWidth: currentStyle.strokeWidth,
                    strokeDashArray: currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null,
                    opacity: currentStyle.opacity,
                    selectable: true,
                    evented: true,
                });
            } else if (tool === "line") {
                shape = buildLineObj(uuid(), point.x, point.y, point.x, point.y, {
                    color: currentStyle.strokeColor,
                    strokeWidth: currentStyle.strokeWidth,
                    strokeDashArray: currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null,
                    opacity: currentStyle.opacity,
                    selectable: true,
                    evented: true,
                });
            } else if (tool === "arrow") {
                shape = buildArrowGroup(uuid(), point.x, point.y, point.x, point.y, {
                    color: currentStyle.strokeColor,
                    strokeWidth: currentStyle.strokeWidth,
                    strokeDashArray: currentStyle.strokeStyle === "dashed" ? [10, 5] : currentStyle.strokeStyle === "dotted" ? [3, 3] : null,
                    opacity: currentStyle.opacity,
                    selectable: true,
                    evented: true,
                });
            }

            shapeRef.current = shape;
            canvas.add(shape);

            // For line/arrow store endpoints on the shape for later use
            if (tool === "line" || tool === "arrow") {
                shape._x1 = point.x;
                shape._y1 = point.y;
                shape._x2 = point.x;
                shape._y2 = point.y;
            }

            socket.emit("shape_create", {
                roomId,
                objectId: shape.objectId,
                type: tool,
                x: shape.left,
                y: shape.top,
                x2: tool === "line" || tool === "arrow" ? point.x : undefined,
                y2: tool === "line" || tool === "arrow" ? point.y : undefined,
                color: tool === "arrow" ? shape.getObjects?.()[0]?.stroke : shape.stroke,
                fill: shape.fill,
                strokeWidth: tool === "arrow" ? shape.getObjects?.()[0]?.strokeWidth : shape.strokeWidth,
                strokeDashArray: tool === "arrow" ? shape.getObjects?.()[0]?.strokeDashArray : shape.strokeDashArray,
                opacity: shape.opacity,
                rx: shape.rx,
                ry: shape.ry
            });
        };

        const handleMouseMove = (event) => {
            if (tool === "pencil" && canvas.isDrawingMode && currentStrokeIdRef.current) {
                currentStrokePointsRef.current.push(event.scenePoint);
                const now = Date.now();
                if (now - lastPencilEmitRef.current > 33) {
                    socket.emit("pencil_stream", {
                        roomId,
                        objectId: currentStrokeIdRef.current,
                        points: currentStrokePointsRef.current,
                        color: currentStrokeStyleRef.current.strokeColor,
                        strokeWidth: currentStrokeStyleRef.current.strokeWidth,
                        strokeDashArray: currentStrokeStyleRef.current.strokeStyle === "dashed" ? [10, 5] : currentStrokeStyleRef.current.strokeStyle === "dotted" ? [3, 3] : null,
                        opacity: currentStrokeStyleRef.current.opacity
                    });
                    lastPencilEmitRef.current = now;
                }
                return;
            }

            if (!drawingRef.current) return;
            const point = event.scenePoint;
            const shape = shapeRef.current;

            if (!shape) return;

            if (tool === "rect") {
                const newWidth = Math.abs(point.x - startXRef.current);
                const newHeight = Math.abs(point.y - startYRef.current);
                const newLeft = Math.min(point.x, startXRef.current);
                const newTop = Math.min(point.y, startYRef.current);

                shape.set({
                    width: newWidth,
                    height: newHeight,
                    left: newLeft,
                    top: newTop,
                });
            }

            if (tool === "circle") {
                const radius = Math.sqrt(
                    Math.pow(point.x - startXRef.current, 2) +
                    Math.pow(point.y - startYRef.current, 2)
                ) / 2;

                const centerX = (startXRef.current + point.x) / 2;
                const centerY = (startYRef.current + point.y) / 2;

                shape.set({
                    radius,
                    left: centerX - radius,
                    top: centerY - radius,
                });
            }

            if (tool === "line" || tool === "arrow") {
                const x1 = startXRef.current;
                const y1 = startYRef.current;
                const x2 = point.x;
                const y2 = point.y;

                // Remove old preview and replace with a freshly built one
                canvas.remove(shape);
                let newShape;
                if (tool === "line") {
                    newShape = buildLineObj(shape.objectId, x1, y1, x2, y2, {
                        color: shape.stroke,
                        strokeWidth: shape.strokeWidth,
                        strokeDashArray: shape.strokeDashArray,
                        opacity: shape.opacity,
                        selectable: true,
                        evented: true,
                    });
                } else {
                    newShape = buildArrowGroup(shape.objectId, x1, y1, x2, y2, {
                        color: shape.getObjects()[0]?.stroke || currentStyle.strokeColor,
                        strokeWidth: shape.getObjects()[0]?.strokeWidth || currentStyle.strokeWidth,
                        strokeDashArray: shape.getObjects()[0]?.strokeDashArray || null,
                        opacity: shape.opacity,
                        selectable: true,
                        evented: true,
                    });
                }
                newShape._x1 = x1;
                newShape._y1 = y1;
                newShape._x2 = x2;
                newShape._y2 = y2;
                canvas.add(newShape);
                shapeRef.current = newShape;
            }

            const currentShape = shapeRef.current;
            if (!currentShape) return;
            currentShape.setCoords();
            canvas.requestRenderAll();

            const now = Date.now();
            if (now - lastShapeEmitRef.current > 33) {
                const emitColor = tool === "arrow"
                    ? currentShape.getObjects?.()[0]?.stroke
                    : currentShape.stroke;
                const emitStrokeWidth = tool === "arrow"
                    ? currentShape.getObjects?.()[0]?.strokeWidth
                    : currentShape.strokeWidth;
                const emitDashArray = tool === "arrow"
                    ? currentShape.getObjects?.()[0]?.strokeDashArray
                    : currentShape.strokeDashArray;

                socket.emit("shape_update", {
                    roomId,
                    objectId: currentShape.objectId,
                    type: tool,
                    x: tool === "line" || tool === "arrow" ? startXRef.current : currentShape.left,
                    y: tool === "line" || tool === "arrow" ? startYRef.current : currentShape.top,
                    x2: tool === "line" || tool === "arrow" ? point.x : undefined,
                    y2: tool === "line" || tool === "arrow" ? point.y : undefined,
                    width: currentShape.width,
                    height: currentShape.height,
                    radius: currentShape.radius,
                    color: emitColor,
                    fill: currentShape.fill,
                    strokeWidth: emitStrokeWidth,
                    strokeDashArray: emitDashArray,
                    opacity: currentShape.opacity,
                    rx: currentShape.rx,
                    ry: currentShape.ry
                });
                lastShapeEmitRef.current = now;
            }
        };
        const handleMouseUp = () => {
            if (!drawingRef.current) return;

            drawingRef.current = false;

            const shape = shapeRef.current;

            if (!shape) return;

            shape.setCoords();

            canvas.setActiveObject(shape);
            canvas.requestRenderAll();
            window.dispatchEvent(new CustomEvent("change-tool", { detail: "select" }));

            // Resolve color/strokeWidth for arrow (stored inside group children)
            const isArrowTool = tool === "arrow";
            const isLineTool = tool === "line";
            const emitColor = isArrowTool
                ? shape.getObjects?.()[0]?.stroke
                : shape.stroke;
            const emitStrokeWidth = isArrowTool
                ? shape.getObjects?.()[0]?.strokeWidth
                : shape.strokeWidth;
            const emitDashArray = isArrowTool
                ? shape.getObjects?.()[0]?.strokeDashArray
                : shape.strokeDashArray;

            socket.emit("shape_complete", {
                objectId: shape.objectId,
                roomId,
                type: tool,
                x: isLineTool || isArrowTool ? (shape._x1 ?? shape.left) : shape.left,
                y: isLineTool || isArrowTool ? (shape._y1 ?? shape.top) : shape.top,
                x2: isLineTool || isArrowTool ? (shape._x2 ?? shape.left) : undefined,
                y2: isLineTool || isArrowTool ? (shape._y2 ?? shape.top) : undefined,
                width: shape.width,
                height: shape.height,
                radius: shape.radius,
                color: emitColor,
                angle: shape.angle || 0,
                fill: shape.fill,
                strokeWidth: emitStrokeWidth,
                strokeDashArray: emitDashArray,
                opacity: shape.opacity,
                rx: shape.rx,
                ry: shape.ry
            }, (response) => {
                if (response && response.success) {
                    latestSeqRef.current = response.seq;
                    saveBoardSnapshot();
                }
            });

            shapeRef.current = null;
        };

        const handlePathCreated = (e) => {
            if (tool === "pencil" && e.path) {
                // ── Pencil stays active: do NOT select the path or switch to Select tool.
                // The stroke is already saved and broadcast by the path:created handler above.
                // Users can immediately draw the next stroke without reselecting the pencil.
            }
        };

        canvas.on("mouse:down", handleMouseDown);
        canvas.on("mouse:move", handleMouseMove);
        canvas.on("mouse:up", handleMouseUp);
        canvas.on("path:created", handlePathCreated);

        return () => {
            canvas.off("mouse:down", handleMouseDown);
            canvas.off("mouse:move", handleMouseMove);
            canvas.off("mouse:up", handleMouseUp);
            canvas.off("path:created", handlePathCreated);
        };
    }, [tool, currentStyle, roomId]);
    useEffect(() => {
        const canvas = fabricCanvasRef.current;

        if (!canvas) return;

        const handleCursorMove = (event) => {
            const point = event.scenePoint;
            if (!point) return;
            const now = Date.now();

            if (
                now - lastCursorEmitRef.current < 30
            ) {
                return;
            }

            lastCursorEmitRef.current = now;

            socket.emit("cursor_move", {
                roomId,
                x: point.x,
                y: point.y,
            });
        };

        canvas.on(
            "mouse:move",
            handleCursorMove
        );

        return () => {
            canvas.off(
                "mouse:move",
                handleCursorMove
            );
        };
    }, [roomId]);

    useEffect(() => {
        const handleManualRestore = () => {
            loadBoard(true);
        };
        socket.on("manual_restore", handleManualRestore);
        return () => socket.off("manual_restore", handleManualRestore);
    }, [roomId]);

    useEffect(() => {
        const handleSaveBoard = async () => {
            try {
                await saveBoardSnapshot(true);
                setAlertConfig({ title: "Success", message: "Board saved successfully", isDestructive: false });
            } catch (error) {
                console.error(error);
                setAlertConfig({ title: "Error", message: "Failed to save board", isDestructive: true });
            }
        };

        window.addEventListener(
            "save-board",
            handleSaveBoard
        );

        return () => {
            window.removeEventListener(
                "save-board",
                handleSaveBoard
            );
        };
    }, [roomId]);
    useEffect(() => {
        const handleLoadBoard = async () => {
            try {
                await loadBoard(true);
                await saveBoardSnapshot(false);
                socket.emit("manual_restore", { roomId });
                setAlertConfig({ title: "Success", message: "Board loaded successfully", isDestructive: false });
            } catch (error) {
                console.error(error);
                setAlertConfig({ title: "Error", message: "Failed to load board", isDestructive: true });
            }
        };

        window.addEventListener(
            "load-board",
            handleLoadBoard
        );

        return () => {
            window.removeEventListener(
                "load-board",
                handleLoadBoard
            );
        };
    }, [roomId]);
    return (
        <div
            ref={containerRef}
            className="relative flex-1 w-full h-full min-h-0 overflow-visible bg-white"
        >
            {loading && (
                <div className="absolute inset-0 z-[100] bg-white p-4">
                    <div className="w-full h-full rounded-2xl skeleton opacity-60" />
                </div>
            )}
            <canvas ref={canvasElementRef} />

            {Object.values(cursors)
                .filter((cursor) => cursor.userId)
                .map((cursor) => {
                    let rx = cursor.x;
                    let ry = cursor.y;
                    if (fabricCanvasRef.current && fabricCanvasRef.current.viewportTransform) {
                        const pt = util.transformPoint(
                            { x: cursor.x, y: cursor.y },
                            fabricCanvasRef.current.viewportTransform
                        );
                        rx = pt.x;
                        ry = pt.y;
                    }
                    return (
                        <div
                            key={cursor.userId}
                            className="absolute pointer-events-none z-50 flex flex-col items-center"
                            style={{
                                left: `${rx}px`,
                                top: `${ry}px`,
                                transform: "translate(-50%, 0)",
                            }}
                        >
                            <div style={{ color: cursor.color, lineHeight: "10px", fontSize: "16px", marginTop: "-2px" }}>
                                ▲
                            </div>
                            <div
                                className="px-2 py-1 rounded text-xs text-white mt-1 shadow-md"
                                style={{ backgroundColor: cursor.color }}
                            >
                                {cursor.userName}
                            </div>
                        </div>
                    );
                })}
                
            <ConfirmModal
                open={!!alertConfig}
                title={alertConfig?.title || "Notification"}
                message={alertConfig?.message || ""}
                confirmText="OK"
                isDestructive={alertConfig?.isDestructive}
                hideCancel={true}
                onConfirm={() => setAlertConfig(null)}
                onCancel={() => setAlertConfig(null)}
            />
        </div>
    );
}

export default CanvasBoard;