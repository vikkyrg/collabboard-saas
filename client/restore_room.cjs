const fs = require('fs');

const path = 'C:\\Users\\rvikk\\.gemini\\antigravity-ide\\brain\\c9c1c67e-1fe0-4cc3-a02f-86a3d4fcdd93\\.system_generated\\logs\\transcript_full.jsonl';
const fileContent = fs.readFileSync(path, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 416 && obj.type === "CODE_ACTION") {
            // The content string has the view_file output.
            // We need to extract the original code.
            const content = obj.content;
            
            // It has lines starting with <number>: 
            // We can match them and write out the original file.
            const codeLines = [];
            const parts = content.split('\n');
            let capturing = false;
            
            for (const p of parts) {
                if (p.startsWith('The following code has been modified')) {
                    capturing = true;
                    continue;
                }
                if (p.startsWith('The above content shows the entire')) {
                    capturing = false;
                    continue;
                }
                if (capturing) {
                    // Match line number
                    const match = p.match(/^\d+:\s(.*)$/);
                    if (match) {
                        codeLines.push(match[1]);
                    } else if (p.match(/^\d+:$/)) {
                        codeLines.push(""); // empty line
                    }
                }
            }
            
            fs.writeFileSync('C:\\Users\\rvikk\\Desktop\\reference\\client\\src\\pages\\RoomPage.jsx', codeLines.join('\n'));
            console.log("RoomPage.jsx restored successfully.");
            break;
        }
    } catch (e) {
        console.error(e);
    }
}
