import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

const regex = /<div className="w-full md:w-\[340px\] lg:w-\[380px\] bg-\[#141414\] overflow-y-auto flex flex-col p-4 sm:p-6 shrink-0 relative z-20">/;

const replacement = `<div className="relative w-full md:w-[340px] lg:w-[380px] bg-[#141414] shrink-0 z-20 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 custom-scrollbar">`;

content = content.replace(regex, replacement);

// We need to add the closing div for the inner scrollable area before the form ends.
// Wait, the "Salvar Alterações" button is inside the Right Column. It should probably be OUTSIDE the scrollable area, fixed at the bottom, or INSIDE the scrollable area?
// Currently it is INSIDE the right column, meaning it scrolls with the content.
// The user drew an arrow covering the ENTIRE bottom, including the buttons.
// Let's keep the buttons inside the scrollable area for now, just closing the div at the end.
const endRegex = /<\/div>\s*<\/form>/;
const endReplacement = `  </div>\n          </div>\n        </form>`;

content = content.replace(endRegex, endReplacement);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);

