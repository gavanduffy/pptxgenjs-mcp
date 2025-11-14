// @ts-ignore
import PptxGenJS from 'pptxgenjs';
import { addSlidesFromMarkdown } from '../src/markdown';

async function main() {
  const pptx = new PptxGenJS();
  const md = `# Title\n\n## Agenda\n- Intro\n- Demo\n- Q&A\n\n## Image\n![Alt text](https://placehold.co/600x400)\n\n## Code\n\n\`\`\`ts\nconsole.log('Hello, world');\n\`\`\`\n`;
  addSlidesFromMarkdown(pptx, md, { splitLevel: 2 });
  const buf = await pptx.write({ outputType: 'arraybuffer' });
  console.log('Generated PPTX bytes:', buf.byteLength);
}

main().catch((e) => { console.error(e); process.exit(1); });
