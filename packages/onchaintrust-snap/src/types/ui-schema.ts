export type UiComponentType =
  | 'address'
  | 'avatar'
  | 'banner'
  | 'bold'
  | 'box'
  | 'button'
  | 'card'
  | 'checkbox'
  | 'container'
  | 'copyable'
  | 'divider'
  | 'dropdown'
  | 'field'
  | 'fileinput'
  | 'footer'
  | 'form'
  | 'heading'
  | 'icon'
  | 'image'
  | 'input'
  | 'italic'
  | 'link'
  | 'option'
  | 'radiogroup'
  | 'radio'
  | 'row'
  | 'section'
  | 'selector'
  | 'selectoroption'
  | 'skeleton'
  | 'spinner'
  | 'text'
  | 'tooltip'
  | 'value';

export type UiChild = string | UiElement;

/**
 * A generic UI element in the V2 schema.
 * - `props`: arbitrary properties for the specific component; validated at render time.
 * - `children`: nested nodes; strings are treated as text nodes.
 */
export type UiElement = Readonly<{
  type: UiComponentType;
  props?: Readonly<Record<string, unknown>>;
  children?: ReadonlyArray<UiChild>;
}>;

/**
 * Server payload containing a UI document and optional severity.
 * For Transaction Insights, MetaMask currently recognizes only 'critical' for severity,
 * but we keep `string` for forward compatibility.
 */
export type UiPayload = Readonly<{
  ui: ReadonlyArray<UiElement>;
  severity?: string;
}>;
