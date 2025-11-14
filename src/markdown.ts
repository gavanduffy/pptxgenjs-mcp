import MarkdownIt from "markdown-it";

export type MarkdownImportOptions = {
  splitLevel?: number;
  titleSlide?: boolean;
  defaults?: {
    titleFontSize?: number;
    bodyFontSize?: number;
    codeFontFace?: string;
    codeFontSize?: number;
    textColor?: string;
  };
  layout?: {
    marginX?: number;
    marginY?: number;
    contentWidth?: number;
  };
  image?: {
    defaultWidth?: number;
    defaultHeight?: number;
  };
};

export function addSlidesFromMarkdown(pptx: any, markdown: string, opts: MarkdownImportOptions = {}) {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
  const tokens = md.parse(markdown, {});

  const splitLevel = opts.splitLevel ?? 2;
  const titleSlide = opts.titleSlide ?? true;
  const defaults = {
    titleFontSize: 32,
    bodyFontSize: 18,
    codeFontFace: "Courier New",
    codeFontSize: 14,
    textColor: "000000",
    ...opts.defaults,
  };
  const layout = {
    marginX: 0.6,
    marginY: 0.6,
    contentWidth: 9.0,
    ...opts.layout,
  };
  const imgDefaults = {
    defaultWidth: 6.0,
    defaultHeight: 3.5,
    ...opts.image,
  };

  let slide: any | null = null;
  let cursorY = layout.marginY + 1.0;

  function ensureSlide() {
    if (!slide) {
      slide = pptx.addSlide();
      cursorY = layout.marginY + 1.0;
    }
  }

  function newSlide() {
    slide = pptx.addSlide();
    cursorY = layout.marginY + 1.0;
  }

  function addTitle(text: string) {
    ensureSlide();
    slide.addText(text, {
      x: layout.marginX,
      y: layout.marginY,
      w: layout.contentWidth,
      h: 0.8,
      fontSize: defaults.titleFontSize,
      bold: true,
      color: defaults.textColor,
    });
  }

  function addParagraph(runs: Array<any>, options: any = {}) {
    ensureSlide();
    slide.addText(runs, {
      x: layout.marginX,
      y: cursorY,
      w: layout.contentWidth,
      h: 0.6,
      fontSize: defaults.bodyFontSize,
      color: defaults.textColor,
      ...options,
    });
    cursorY += 0.6;
  }

  function addCodeBlock(text: string) {
    ensureSlide();
    slide.addText(text, {
      x: layout.marginX,
      y: cursorY,
      w: layout.contentWidth,
      h: 1.0,
      fontFace: defaults.codeFontFace,
      fontSize: defaults.codeFontSize,
      color: defaults.textColor,
    });
    cursorY += 1.0;
  }

  function addImage(path: string, alt?: string) {
    ensureSlide();
    slide.addImage({
      path,
      x: layout.marginX,
      y: cursorY,
      w: imgDefaults.defaultWidth,
      h: imgDefaults.defaultHeight,
    });
    cursorY += imgDefaults.defaultHeight + 0.2;
    if (alt) {
      addParagraph([{ text: alt }], { italic: true, fontSize: defaults.bodyFontSize - 2 });
    }
  }

  function inlineToRuns(children: any[]): Array<any> {
    const runs: any[] = [];
    for (const child of children) {
      if (child.type === 'text') {
        runs.push({ text: child.content });
      } else if (child.type === 'code_inline') {
        runs.push({ text: child.content, fontFace: defaults.codeFontFace });
      } else if (child.type === 'softbreak' || child.type === 'hardbreak') {
        runs.push({ text: '\n' });
      } else if (child.content) {
        runs.push({ text: child.content });
      }
    }
    const merged: any[] = [];
    for (const run of runs) {
      if (merged.length && !run.options && !merged[merged.length - 1].options) {
        merged[merged.length - 1].text += run.text ?? '';
      } else {
        merged.push(run);
      }
    }
    return merged;
  }

  // Optional title slide from first H1
  let consumedFirstH1 = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!consumedFirstH1 && titleSlide && t.type === 'heading_open' && t.tag === 'h1') {
      const inline = tokens[i + 1];
      if (inline && inline.type === 'inline') {
        newSlide();
        addTitle(inline.content);
        consumedFirstH1 = true;
      }
    }
  }

  // Main pass
  slide = null;
  cursorY = layout.marginY + 1.0;

  function startSlideWithHeading(level: number, content: string) {
    if (level <= splitLevel) {
      if (slide) newSlide(); else ensureSlide();
      addTitle(content);
    } else {
      ensureSlide();
      addParagraph([{ text: content, options: { bold: true } }]);
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const level = parseInt(t.tag.substring(1), 10);
      const inline = tokens[i + 1];
      if (inline && inline.type === 'inline') {
        startSlideWithHeading(level, inline.content);
      }
      while (i < tokens.length && tokens[i].type !== 'heading_close') i++;
      continue;
    }
    if (t.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      if (inline && inline.type === 'inline') {
        addParagraph(inlineToRuns(inline.children || []));
      }
      while (i < tokens.length && tokens[i].type !== 'paragraph_close') i++;
      continue;
    }
    if (t.type === 'fence' || t.type === 'code_block') {
      addCodeBlock(t.content);
      continue;
    }
    if (t.type === 'bullet_list_open' || t.type === 'ordered_list_open') {
      let listLevel = 0;
      const stack: number[] = [];
      while (i < tokens.length) {
        i++;
        const lt = tokens[i];
        if (!lt) break;
        if (lt.type === 'list_item_open') {
          // Collect until list_item_close
          let text = '';
          let j = i + 1;
          while (j < tokens.length && tokens[j].type !== 'list_item_close') {
            const it = tokens[j];
            if (it.type === 'paragraph_open') {
              const inline = tokens[j + 1];
              if (inline && inline.type === 'inline') {
                text += inline.content;
              }
              while (j < tokens.length && tokens[j].type !== 'paragraph_close') j++;
            } else if (it.type === 'inline') {
              text += it.content;
            }
            j++;
          }
          i = j;
          addParagraph([{ text }], { bullet: { level: listLevel } });
        } else if (lt.type === 'bullet_list_open' || lt.type === 'ordered_list_open') {
          stack.push(listLevel);
          listLevel++;
        } else if (lt.type === 'bullet_list_close' || lt.type === 'ordered_list_close') {
          listLevel = stack.pop() ?? 0;
          if (stack.length === 0 && (lt.type.endsWith('close'))) {
            break;
          }
        }
      }
      continue;
    }
    if (t.type === 'blockquote_open') {
      const parts: string[] = [];
      let j = i + 1;
      while (j < tokens.length && tokens[j].type !== 'blockquote_close') {
        const bt = tokens[j];
        if (bt.type === 'inline') parts.push(bt.content);
        j++;
      }
      i = j;
      addParagraph([{ text: parts.join(' ') }], { italic: true });
      continue;
    }
    if (t.type === 'hr') {
      cursorY += 0.3;
      continue;
    }
    if (t.type === 'inline' && t.children) {
      for (const child of t.children) {
        if (child.type === 'image') {
          const src = child.attrGet('src');
          const alt = child.attrGet('alt') || '';
          if (src) addImage(src, alt);
        }
      }
    }
  }
}
