# Pptxgenjs Types

[prompt markdown to JSON](https://www.notion.so/prompt-markdown-to-JSON-2a4383b709058071bef1db50bc2f6d5a?pvs=21)

# PptxGenJS Type Definitions Guide

## Core Classes

### `PptxGenJS`

The main presentation class. Create an instance to start building presentations.

```tsx
const pptx = new PptxGenJS()

```

**Key Properties:**

- `version: string` - Library version
- `layout: string` - Presentation layout name
- `author: string` - Presentation author
- `company: string` - Company name
- `title: string` - Presentation title
- `theme: ThemeProps` - Presentation theme settings

**Key Methods:**

- `addSlide(props?: AddSlideProps): Slide` - Add new slide
- `addSection(props: SectionProps): void` - Add section
- `defineLayout(layout: PresLayout): void` - Define custom layout
- `defineSlideMaster(props: SlideMasterProps): void` - Define slide master
- `writeFile(props?: WriteFileProps): Promise<string>` - Export to file
- `write(props?: WriteProps): Promise<content>` - Export with custom output type
- `stream(props?: WriteBaseProps): Promise<content>` - Export to stream

### `Slide`

Represents a presentation slide. Obtained via `pptx.addSlide()`.

**Properties:**

- `background: BackgroundProps` - Slide background
- `color: HexColor` - Default text color
- `hidden: boolean` - Hide slide
- `slideNumber: SlideNumberProps` - Slide number options

**Methods:**

- `addChart(type, data, options): Slide` - Add chart
- `addImage(options): Slide` - Add image
- `addMedia(options): Slide` - Add audio/video
- `addNotes(notes): Slide` - Add speaker notes
- `addShape(shapeName, options): Slide` - Add shape
- `addTable(tableRows, options): Slide` - Add table
- `addText(text, options): Slide` - Add text

---

## Enums

### `AlignH`

Horizontal alignment options.

- `'left'` - Left align
- `'center'` - Center align
- `'right'` - Right align
- `'justify'` - Justify

### `AlignV`

Vertical alignment options.

- `'top'` - Top align
- `'middle'` - Middle align
- `'bottom'` - Bottom align

### `ChartType`

Chart type identifiers.

- `'area'`, `'bar'`, `'bar3D'`, `'bubble'`, `'bubble3D'`, `'doughnut'`, `'line'`, `'pie'`, `'radar'`, `'scatter'`

### `OutputType`

Export output formats.

- `'arraybuffer'`, `'base64'`, `'binarystring'`, `'blob'`, `'nodebuffer'`, `'uint8array'`

### `SchemeColor`

Theme color references.

- `'text1'`, `'text2'`, `'background1'`, `'background2'`
- `'accent1'` through `'accent6'`

### `ShapeType`

All available shape names (200+ shapes).
Examples: `'rect'`, `'ellipse'`, `'roundRect'`, `'triangle'`, `'diamond'`, `'arrow'`, etc.

### `PLACEHOLDER_TYPES`

Placeholder types for master slides.

- `'title'`, `'body'`, `'pic'`, `'chart'`, `'tbl'`, `'media'`

---

## Type Aliases

### Position & Size

### `Coord`

Coordinate value: number (inches) or percentage string.

```tsx
type Coord = number | `${number}%`
// Examples: 2.5, '50%'

```

### `PositionProps`

Object positioning and sizing.

```tsx
interface PositionProps {
  x?: Coord  // Horizontal position
  y?: Coord  // Vertical position
  w?: Coord  // Width
  h?: Coord  // Height
}

```

### Colors

### `HexColor`

Hex color string (without #).

```tsx
type HexColor = string
// Example: 'FF3399'

```

### `ThemeColor`

Theme color reference.

```tsx
type ThemeColor = 'tx1' | 'tx2' | 'bg1' | 'bg2' | 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6'

```

### `Color`

Either hex or theme color.

```tsx
type Color = HexColor | ThemeColor

```

### Alignment

### `HAlign`

Horizontal text alignment.

```tsx
type HAlign = 'left' | 'center' | 'right' | 'justify'

```

### `VAlign`

Vertical text alignment.

```tsx
type VAlign = 'top' | 'middle' | 'bottom'

```

### `Margin`

Margin specification.

```tsx
type Margin = number | [number, number, number, number]
// Single value = all sides, Array = [top, right, bottom, left]

```

### Charts

### `CHART_NAME`

Valid chart type names.

```tsx
type CHART_NAME = 'area' | 'bar' | 'bar3D' | 'bubble' | 'doughnut' | 'line' | 'pie' | 'radar' | 'scatter'

```

### `MediaType`

Media element types.

```tsx
type MediaType = 'audio' | 'online' | 'video'

```

---

## Interface Categories

### Background & Fill

### `BackgroundProps`

Slide or shape background.

```tsx
interface BackgroundProps {
  color?: HexColor           // Solid color
  transparency?: number      // 0-100
  path?: string             // Image URL/path
  data?: string             // Base64 image data
}

```

### `ShapeFillProps`

Shape fill properties.

```tsx
interface ShapeFillProps {
  color?: Color             // Fill color
  transparency?: number     // 0-100
  type?: 'none' | 'solid'  // Fill type
}

```

### Borders & Lines

### `BorderProps`

Border styling.

```tsx
interface BorderProps {
  type?: 'none' | 'dash' | 'solid'
  color?: HexColor
  pt?: number  // Border width in points
}

```

### `ShapeLineProps`

Line/border with advanced options.

```tsx
interface ShapeLineProps extends ShapeFillProps {
  width?: number
  dashType?: 'solid' | 'dash' | 'dashDot' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'sysDash' | 'sysDot'
  beginArrowType?: 'none' | 'arrow' | 'diamond' | 'oval' | 'stealth' | 'triangle'
  endArrowType?: 'none' | 'arrow' | 'diamond' | 'oval' | 'stealth' | 'triangle'
}

```

### Effects

### `ShadowProps`

Shadow effects.

```tsx
interface ShadowProps {
  type: 'outer' | 'inner' | 'none'
  opacity?: number      // 0-1
  blur?: number         // 0-100 points
  angle?: number        // 0-359 degrees
  offset?: number       // 0-200 points
  color?: HexColor
  rotateWithShape?: boolean
}

```

### Text Properties

### `TextBaseProps`

Base text formatting options.

```tsx
interface TextBaseProps {
  align?: HAlign
  bold?: boolean
  color?: Color
  fontFace?: string
  fontSize?: number
  italic?: boolean
  underline?: { style?: string, color?: Color }
  valign?: VAlign
  // ... many more options
}

```

### `TextPropsOptions`

Extended text options for text boxes.

```tsx
interface TextPropsOptions extends PositionProps, TextBaseProps {
  fill?: ShapeFillProps
  line?: ShapeLineProps
  margin?: Margin
  rotate?: number
  shadow?: ShadowProps
  shape?: SHAPE_NAME
  // ... many more options
}

```

### `TextProps`

Text element with content and options.

```tsx
interface TextProps {
  text?: string
  options?: TextPropsOptions
}

```

### Images

### `DataOrPathProps`

Image source specification.

```tsx
interface DataOrPathProps {
  path?: string  // URL or file path
  data?: string  // Base64 encoded
}

```

### `ImageProps`

Image element properties.

```tsx
interface ImageProps extends PositionProps, DataOrPathProps {
  altText?: string
  flipH?: boolean
  flipV?: boolean
  hyperlink?: HyperlinkProps
  rotate?: number
  rounding?: boolean
  shadow?: ShadowProps
  sizing?: {
    type: 'contain' | 'cover' | 'crop'
    w: Coord
    h: Coord
    x?: Coord  // crop only
    y?: Coord  // crop only
  }
  transparency?: number  // 0-100
}

```

### Media

### `MediaProps`

Audio/video element properties.

```tsx
interface MediaProps extends PositionProps, DataOrPathProps {
  type: MediaType
  cover?: string      // Cover image path
  extn?: string       // File extension
  link?: string       // Embed link (YouTube, etc.)
}

```

### Shapes

### `ShapeProps`

Shape element properties.

```tsx
interface ShapeProps extends PositionProps {
  align?: HAlign
  fill?: ShapeFillProps
  line?: ShapeLineProps
  flipH?: boolean
  flipV?: boolean
  hyperlink?: HyperlinkProps
  rotate?: number
  shadow?: ShadowProps
  rectRadius?: number  // For rounded rectangles
  // ... shape-specific options
}

```

### Tables

### `TableCell`

Table cell content and formatting.

```tsx
interface TableCell {
  text?: string | TableCell[]
  options?: TableCellProps
}

```

### `TableCellProps`

Cell-level formatting.

```tsx
interface TableCellProps extends TextBaseProps {
  border?: BorderProps | [BorderProps, BorderProps, BorderProps, BorderProps]
  colspan?: number
  rowspan?: number
  fill?: ShapeFillProps
  margin?: Margin
}

```

### `TableRow`

Array of table cells.

```tsx
type TableRow = TableCell[]

```

### `TableProps`

Table element properties.

```tsx
interface TableProps extends PositionProps, TextBaseProps {
  autoPage?: boolean
  border?: BorderProps | [BorderProps, BorderProps, BorderProps, BorderProps]
  colW?: number | number[]
  rowH?: number | number[]
  fill?: ShapeFillProps
  margin?: Margin
  // ... auto-paging options
}

```

### `TableToSlidesProps`

Advanced table with auto-paging.

```tsx
interface TableToSlidesProps extends TableProps {
  autoPageRepeatHeader?: boolean
  autoPageHeaderRows?: number
  masterSlideName?: string
  addImage?: { image: DataOrPathProps, options: PositionProps }
  addShape?: { shapeName: SHAPE_NAME, options: ShapeProps }
  addTable?: { rows: TableRow[], options: TableProps }
  addText?: { text: TextProps[], options: TextPropsOptions }
}

```

### Charts

### `OptsChartData`

Chart data series.

```tsx
interface OptsChartData {
  labels?: string[] | string[][]  // Category labels
  name?: string                    // Series name
  values?: number[]                // Data values
  sizes?: number[]                 // Bubble sizes
}

```

### `IChartOpts`

Comprehensive chart options (extends many interfaces).

```tsx
interface IChartOpts {
  // Axes
  catAxisTitle?: string
  valAxisTitle?: string
  showCatAxisTitle?: boolean
  showValAxisTitle?: boolean

  // Legend
  showLegend?: boolean
  legendPos?: 'b' | 'l' | 'r' | 't' | 'tr'

  // Data labels
  showLabel?: boolean
  showValue?: boolean
  showPercent?: boolean
  dataLabelFormatCode?: string

  // ... 100+ more options for full chart customization
}

```

### `IChartMulti`

Multi-type chart specification.

```tsx
interface IChartMulti {
  type: CHART_NAME
  data: OptsChartData[]
  options: IChartOpts
}

```

### Links

### `HyperlinkProps`

Hyperlink configuration.

```tsx
interface HyperlinkProps {
  slide?: number   // Link to slide number
  url?: string     // External URL
  tooltip?: string // Hover tooltip
}

```

### Presentation Structure

### `SectionProps`

Presentation section.

```tsx
interface SectionProps {
  title: string
  order?: number  // Section position (1-n)
}

```

### `PresLayout`

Custom layout dimensions.

```tsx
interface PresLayout {
  name: string
  width: number   // inches
  height: number  // inches
}

```

### `SlideMasterProps`

Master slide definition.

```tsx
interface SlideMasterProps {
  title: string
  background?: BackgroundProps
  margin?: Margin
  slideNumber?: SlideNumberProps
  objects?: Array<...>  // Placeholders and objects
}

```

### `PlaceholderProps`

Placeholder on master slide.

```tsx
interface PlaceholderProps extends PositionProps, TextBaseProps {
  name: string
  type: PLACEHOLDER_TYPE
  margin?: Margin
}

```

### `SlideNumberProps`

Slide number formatting.

```tsx
interface SlideNumberProps extends PositionProps, TextBaseProps {
  margin?: Margin
}

```

### `ThemeProps`

Presentation theme fonts.

```tsx
interface ThemeProps {
  headFontFace?: string  // Headings font
  bodyFontFace?: string  // Body font
}

```

### Export Options

### `WriteBaseProps`

Base export options.

```tsx
interface WriteBaseProps {
  compression?: boolean  // Enable compression
}

```

### `WriteProps`

Export with output type.

```tsx
interface WriteProps extends WriteBaseProps {
  outputType?: WRITE_OUTPUT_TYPE
}

```

### `WriteFileProps`

File export options.

```tsx
interface WriteFileProps extends WriteBaseProps {
  fileName?: string  // Default: 'Presentation.pptx'
}

```

### Utility

### `ObjectNameProps`

Named object reference.

```tsx
interface ObjectNameProps {
  objectName?: string  // Custom name for object
}

```

### `AddSlideProps`

Options when adding slide.

```tsx
interface AddSlideProps {
  masterName?: string
  sectionTitle?: string
}

```

---

## Usage Patterns

### Basic Presentation

```tsx
const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'John Doe'
pptx.title = 'My Presentation'

const slide = pptx.addSlide()
slide.addText('Hello World', { x: 1, y: 1, fontSize: 24 })

await pptx.writeFile({ fileName: 'output.pptx' })

```

### With Type Safety

```tsx
const textOptions: PptxGenJS.TextPropsOptions = {
  x: 1,
  y: 1,
  w: 8,
  h: 1,
  fontSize: 18,
  bold: true,
  color: 'FF0000'
}

const imageOptions: PptxGenJS.ImageProps = {
  path: 'image.png',
  x: 1,
  y: 2,
  w: 4,
  h: 3
}

const tableData: PptxGenJS.TableRow[] = [
  [{ text: 'Header 1' }, { text: 'Header 2' }],
  [{ text: 'Cell 1' }, { text: 'Cell 2' }]
]

```

---

## Key Concepts

1. **Coordinates**: Use `Coord` type - either inches (`2.5`) or percentage (`'50%'`)
2. **Colors**: Use `HexColor` without `#` (`'FF3399'`) or `ThemeColor` enums
3. **Margins**: Single value for all sides or `[top, right, bottom, left]`
4. **Chaining**: Most `Slide` methods return `this` for method chaining
5. **Auto-paging**: Tables can auto-create slides when content overflows
6. **Master Slides**: Define once, reuse for consistent styling
7. **Transparency**: Range 0-100 (0 = opaque, 100 = fully transparent)