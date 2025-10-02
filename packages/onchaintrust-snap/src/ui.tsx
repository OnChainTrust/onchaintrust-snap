import {
  Address,
  Avatar,
  Banner,
  Bold,
  Box,
  Button,
  Card,
  Checkbox,
  Copyable,
  Divider,
  Dropdown,
  Field,
  Form,
  Heading,
  Icon,
  Image,
  Input,
  Italic,
  Link,
  Option,
  Radio,
  RadioGroup,
  Row,
  Section,
  Skeleton,
  Spinner,
  Text,
  Tooltip,
  Value,
} from '@metamask/snaps-sdk/jsx';

import type { UiElement, UiChild } from './types/ui-schema';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Coerce an unknown value to string with a fallback.
 *
 * @param value The value to coerce.
 * @param fallback Fallback to use when value is not a string.
 * @returns A string.
 */
function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Coerce an unknown value to boolean with a fallback.
 *
 * @param value The value to coerce.
 * @param fallback Fallback to use when value is not a boolean.
 * @returns A boolean.
 */
function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/* ---- Address/account helpers ---- */
type Caip2 = `${string}:${string}`;
type Caip10 = `${string}:${string}:${string}`;

const HEX_40 = /^0x[0-9a-fA-F]{40}$/u; // EVM 0x… address
const CAIP2_RE = /^[^:]+:[^:]+$/u; // namespace:reference
const CAIP10_RE = /^[^:]+:[^:]+:[^:]+$/u; // namespace:reference:address

/**
 * Return CAIP-10 if `value` already is CAIP-10; or build it from (0x + CAIP-2).
 *
 * @param value Address candidate (0x… or CAIP-10).
 * @param chainIdCandidate Optional CAIP-2 chain id to combine with 0x address.
 * @returns A CAIP-10 string or undefined if inputs are insufficient.
 */
function toCaip10Maybe(
  value: unknown,
  chainIdCandidate?: unknown,
): Caip10 | undefined {
  const raw = typeof value === 'string' ? value : '';
  if (CAIP10_RE.test(raw)) {
    return raw as Caip10;
  }

  const isHex = HEX_40.test(raw);
  const chain =
    typeof chainIdCandidate === 'string' && CAIP2_RE.test(chainIdCandidate)
      ? (chainIdCandidate as Caip2)
      : undefined;

  if (isHex && chain) {
    return `${chain}:${raw}`;
  }
  return undefined;
}

/**
 * For <Address/>: accept either 0x… or CAIP-10; otherwise return undefined.
 *
 * @param value Address candidate.
 * @returns String address or undefined if invalid.
 */
function asAddressValue(value: unknown): string | undefined {
  const str = typeof value === 'string' ? value : '';
  if (HEX_40.test(str) || CAIP10_RE.test(str)) {
    return str;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Rendering helpers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Render inline children for Text/Link/Button.
 * Supports: plain strings, <Bold/Italic/Icon/Image/>.
 * Safe against undefined/null entries.
 *
 * @param children Inline children array (readonly).
 * @param keyPrefix React key prefix.
 * @returns An array of inline React nodes.
 */
function renderInlineChildren(
  children: readonly UiChild[] | undefined,
  keyPrefix: string,
): any[] {
  return (children ?? [])
    .map((child, index) => {
      const key = `${keyPrefix}-inline-${index}`;

      if (child === null || child === undefined) {
        return null;
      }
      if (typeof child === 'string') {
        return child;
      }

      const el = child as Partial<UiElement>;
      if (el && typeof (el as any).type === 'string') {
        if (el.type === 'bold') {
          return <Bold key={key}>{asString((el.props as any)?.children)}</Bold>;
        }
        if (el.type === 'italic') {
          return (
            <Italic key={key}>{asString((el.props as any)?.children)}</Italic>
          );
        }
        if (el.type === 'icon') {
          return (
            <Icon
              key={key}
              name={asString((el.props as any)?.name, 'info') as any}
              {...((el.props as any)?.size === undefined
                ? {}
                : { size: asString((el.props as any)?.size) as any })}
              {...((el.props as any)?.color === undefined
                ? {}
                : { color: asString((el.props as any)?.color) as any })}
            />
          );
        }
        if (el.type === 'image') {
          return (
            <Image
              key={key}
              src={asString((el.props as any)?.src)}
              alt={asString((el.props as any)?.alt)}
            />
          );
        }
      }
      return null;
    })
    .filter(Boolean) as any[];
}

/**
 * Render container children (strings are wrapped with <Text/>).
 *
 * @param children Children array (readonly).
 * @param keyPrefix React key prefix.
 * @returns An array of container-safe React nodes.
 */
function renderContainerChildren(
  children: readonly UiChild[] | undefined,
  keyPrefix: string,
): any[] {
  return (children ?? [])
    .map((child, index) => {
      const key = `${keyPrefix}-child-${index}`;
      if (child === null || child === undefined) {
        return null;
      }
      if (typeof child === 'string') {
        return <Text key={key}>{child}</Text>;
      }
      return renderNode(child, key);
    })
    .filter(Boolean) as any[];
}

/**
 * Banner-specific children (whitelist inline content only).
 * Per docs: Text, Link, Icon, Button, Skeleton.
 * Bold/Italic should be nested within Text if needed, not direct children of Banner.
 *
 * @param children Children array (readonly).
 * @param keyPrefix React key prefix.
 * @returns An array of allowed banner children.
 */
function renderBannerChildren(
  children: readonly UiChild[] | undefined,
  keyPrefix: string,
): any[] {
  const allowed = new Set<UiElement['type']>([
    'text',
    'link',
    'icon',
    'button',
    'skeleton',
  ]);
  return (children ?? [])
    .map((child, index) => {
      const key = `${keyPrefix}-banner-${index}`;
      if (child === null || child === undefined) {
        return null;
      }
      if (typeof child === 'string') {
        return <Text key={key}>{child}</Text>;
      }
      const el = child;
      if (!allowed.has(el.type)) {
        return null;
      }

      // Inline-only for text/link/button to prevent nested containers
      if (el.type === 'text' || el.type === 'link' || el.type === 'button') {
        const inl = renderInlineChildren(el.children, key);
        switch (el.type) {
          case 'text':
            return (
              <Text key={key}>
                {inl.length ? (inl as any) : asString(el.props?.children)}
              </Text>
            );
          case 'link':
            return (
              <Link key={key} href={asString(el.props?.href)}>
                {inl.length ? (inl as any) : asString(el.props?.children)}
              </Link>
            );
          case 'button':
            return (
              <Button
                key={key}
                type={asString(el.props?.type, 'button') as any}
                name={asString(el.props?.name)}
                variant={asString(el.props?.variant, 'primary') as any}
              >
                {inl.length ? (inl as any) : asString(el.props?.children)}
              </Button>
            );
          default:
            return null;
        }
      }
      // For icon/skeleton, reuse generic renderer
      return renderNode(el, key);
    })
    .filter(Boolean) as any[];
}

/**
 * Tooltip content can be a string or a single UiElement/UiChild.
 * Normalizes it to either a string or a rendered node.
 *
 * @param content Tooltip content.
 * @param key React key prefix.
 * @returns A string or a React node.
 */
function renderTooltipContent(content: unknown, key: string): any {
  if (typeof content === 'string') {
    return content;
  }
  const maybe = content as Partial<UiElement>;
  if (maybe && typeof maybe === 'object' && 'type' in (maybe as any)) {
    return renderNode(maybe as UiElement, `${key}-content`);
  }
  return asString(content);
}

/**
 * Allowed child for <Row/>: Text | Image | Address | Link | Value.
 * Returns placeholder Text("") for undefined.
 *
 * @param child The row child.
 * @param key React key prefix.
 * @returns A rendered child or placeholder.
 */
function renderRowChild(child: UiChild | undefined, key: string): any {
  if (child === undefined) {
    return <Text key={`${key}-empty`}>{''}</Text>;
  }
  if (typeof child === 'string') {
    return <Text key={`${key}-text`}>{child}</Text>;
  }
  const el = child;

  if (
    el.type === 'text' ||
    el.type === 'image' ||
    el.type === 'address' ||
    el.type === 'link' ||
    el.type === 'value'
  ) {
    return renderNode(el, `${key}-child-0`);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Type guards for structure-sensitive components                     */
/* ------------------------------------------------------------------ */

/**
 * Check if element is an <Option/>.
 *
 * @param el Element to check.
 * @returns True if element is option.
 */
function isOption(el?: UiElement): el is UiElement & { type: 'option' } {
  return el?.type === 'option';
}

/**
 * Check if element is a <Radio/>.
 *
 * @param el Element to check.
 * @returns True if element is radio.
 */
function isRadio(el?: UiElement): el is UiElement & { type: 'radio' } {
  return el?.type === 'radio';
}

/**
 * Check if element is an allowed Field child (Dropdown | Input | Selector | RadioGroup).
 *
 * @param el Element to check.
 * @returns True if allowed.
 */
function isFieldChild(el?: UiElement): el is UiElement {
  const elementType = el?.type;
  return (
    elementType === 'dropdown' ||
    elementType === 'input' ||
    elementType === 'selector' ||
    elementType === 'radiogroup'
  );
}

/**
 * Check if element is an allowed Form child (Field | Input | Button).
 *
 * @param el Element to check.
 * @returns True if allowed.
 */
function isFormChild(el?: UiElement): el is UiElement {
  const elementType = el?.type;
  return (
    elementType === 'field' ||
    elementType === 'input' ||
    elementType === 'button'
  );
}

/* ------------------------------------------------------------------ */
/* Renderer registry                                                  */
/* ------------------------------------------------------------------ */

type Renderer = (
  props: Record<string, unknown>,
  children: readonly UiChild[] | undefined,
  key: string,
) => any;

/**
 * Registry: unknown types are skipped by renderNode().
 * Where SDK enforces strict child unions, we validate or filter accordingly.
 */
const renderers: Partial<Record<UiElement['type'], Renderer>> = {
  box: (props, children, key) => (
    <Box
      key={key}
      {...('direction' in props
        ? { direction: asString(props.direction) as any }
        : {})}
      center={asBoolean(props.center, false)}
      {...('alignment' in props
        ? { alignment: asString(props.alignment) as any }
        : {})}
    >
      {renderContainerChildren(children, key) as any}
    </Box>
  ),

  section: (props, children, key) => (
    <Section
      key={key}
      {...('direction' in props
        ? { direction: asString(props.direction) as any }
        : {})}
      {...('alignment' in props
        ? { alignment: asString(props.alignment) as any }
        : {})}
    >
      {renderContainerChildren(children, key) as any}
    </Section>
  ),

  heading: (props, _children, key) => (
    <Heading
      key={key}
      {...('size' in props ? { size: asString(props.size) as any } : {})}
    >
      {asString(props.children)}
    </Heading>
  ),

  text: (props, children, key) => {
    const inl = renderInlineChildren(children, key);
    return (
      <Text
        key={key}
        {...('color' in props ? { color: asString(props.color) as any } : {})}
        {...('alignment' in props
          ? { alignment: asString(props.alignment) as any }
          : {})}
        {...('size' in props ? { size: asString(props.size) as any } : {})}
        {...('fontWeight' in props
          ? { fontWeight: asString(props.fontWeight) as any }
          : {})}
      >
        {inl.length ? (inl as any) : asString(props.children)}
      </Text>
    );
  },

  bold: (props, _children, key) => (
    <Bold key={key}>{asString(props.children)}</Bold>
  ),
  italic: (props, _children, key) => (
    <Italic key={key}>{asString(props.children)}</Italic>
  ),

  divider: (_props, _children, _key) => (<Divider />) as any,
  spinner: (_props, _children, _key) => <Spinner />,

  copyable: (props, _children, key) => (
    <Copyable
      key={key}
      value={asString(props.value)}
      {...('sensitive' in props
        ? { sensitive: asBoolean(props.sensitive, false) }
        : {})}
    />
  ),

  image: (props, _children, key) => (
    <Image key={key} src={asString(props.src)} alt={asString(props.alt)} />
  ),

  icon: (props, _children, key) => (
    <Icon
      key={key}
      name={asString(props.name, 'info') as any}
      {...('size' in props ? { size: asString(props.size) as any } : {})}
      {...('color' in props ? { color: asString(props.color) as any } : {})}
    />
  ),

  address: (props, _children, key) => {
    const addr = asAddressValue(props.address);
    if (!addr) {
      return null;
    }
    return (
      <Address
        key={key}
        address={addr as any}
        {...('truncate' in props
          ? { truncate: asBoolean(props.truncate, true) }
          : {})}
        {...('displayName' in props
          ? { displayName: asBoolean(props.displayName, true) }
          : {})}
        {...('avatar' in props
          ? { avatar: asBoolean(props.avatar, true) }
          : {})}
      />
    );
  },

  avatar: (props, _children, key) => {
    const caip10 =
      toCaip10Maybe((props as any).address, (props as any).chainId) ??
      toCaip10Maybe((props as any).account, (props as any).chainId);
    if (!caip10) {
      return null;
    }
    return (
      <Avatar
        key={key}
        address={caip10 as any}
        {...('size' in props ? { size: asString(props.size) as any } : {})}
      />
    );
  },

  banner: (props, children, key) => {
    const body = renderBannerChildren(children, key);
    const safeBody = body.length
      ? body
      : [<Text key={`${key}-placeholder`}>{''}</Text>];
    return (
      <Banner
        key={key}
        title={asString(props.title)}
        severity={asString(props.severity, 'info') as any}
      >
        {safeBody as any}
      </Banner>
    );
  },

  button: (props, children, key) => {
    const inl = renderInlineChildren(children, key);
    return (
      <Button
        key={key}
        type={asString(props.type, 'button') as any}
        {...('name' in props ? { name: asString(props.name) } : {})}
        {...('variant' in props
          ? { variant: asString(props.variant, 'primary') as any }
          : {})}
      >
        {inl.length ? (inl as any) : asString(props.children)}
      </Button>
    );
  },

  checkbox: (props, _children, key) => (
    <Checkbox
      key={key}
      name={asString(props.name)}
      {...('checked' in props
        ? { checked: asBoolean(props.checked, false) }
        : {})}
      {...('variant' in props
        ? { variant: asString(props.variant, 'default') as any }
        : {})}
      {...('label' in props ? { label: asString(props.label) } : {})}
    />
  ),

  dropdown: (props, children, key) => (
    <Dropdown key={key} name={asString(props.name)}>
      {
        (children ?? [])
          .map((childEl, i) => {
            if (typeof childEl === 'string') {
              return null;
            }
            return isOption(childEl)
              ? renderNode(childEl, `${key}-opt-${i}`)
              : null;
          })
          .filter(Boolean) as any
      }
    </Dropdown>
  ),

  option: (props, _children, key) => (
    <Option key={key} value={asString(props.value)}>
      {asString(props.label) || asString(props.children)}
    </Option>
  ),

  form: (props, children, key) => (
    <Form key={key} name={asString(props.name)}>
      {
        (children ?? [])
          .map((childEl, i) => {
            if (typeof childEl === 'string') {
              return null;
            }
            return isFormChild(childEl)
              ? renderNode(childEl, `${key}-f-${i}`)
              : null;
          })
          .filter(Boolean) as any
      }
    </Form>
  ),

  field: (props, children, key) => {
    const childEl = (children ?? []).find(
      (child): child is UiElement => typeof child !== 'string',
    );
    if (!childEl || !isFieldChild(childEl)) {
      return null;
    }
    return (
      <Field key={key} label={asString(props.label)}>
        {renderNode(childEl, `${key}-0`)}
      </Field>
    );
  },

  input: (props, _children, key) => (
    <Input
      key={key}
      name={asString(props.name)}
      {...('placeholder' in props
        ? { placeholder: asString(props.placeholder) }
        : {})}
      {...('type' in props ? { type: asString(props.type) as any } : {})}
      {...('min' in (props as any) ? { min: (props as any).min } : {})}
      {...('max' in (props as any) ? { max: (props as any).max } : {})}
      {...('step' in (props as any) ? { step: (props as any).step } : {})}
    />
  ),

  radiogroup: (props, children, key) => (
    <RadioGroup key={key} name={asString(props.name)}>
      {
        (children ?? [])
          .map((childEl, i) => {
            if (typeof childEl === 'string') {
              return null;
            }
            return isRadio(childEl)
              ? renderNode(childEl, `${key}-r-${i}`)
              : null;
          })
          .filter(Boolean) as any
      }
    </RadioGroup>
  ),

  radio: (props, _children, key) => (
    <Radio key={key} value={asString(props.value)}>
      {asString(props.children)}
    </Radio>
  ),

  row: (props, children, key) => {
    const label = typeof props.label === 'string' ? props.label : '';
    const variant =
      typeof props.variant === 'string' ? (props.variant as any) : undefined;
    const onlyChild = renderRowChild(children?.[0], key);
    return (
      <Row key={key} label={label} {...(variant ? { variant } : {})}>
        {onlyChild}
      </Row>
    );
  },

  value: (props, _children, key) => (
    <Value
      key={key}
      value={asString(props.value)}
      extra={asString(props.extra, '')}
    />
  ),

  card: (props, _children, key) => (
    <Card
      key={key}
      title={(props as any).title}
      value={asString(props.value)}
      {...('image' in props ? { image: asString(props.image) } : {})}
      {...('description' in props
        ? { description: asString(props.description) }
        : {})}
      {...('extra' in props ? { extra: asString(props.extra) } : {})}
    />
  ),

  tooltip: (props, children, key) => (
    <Tooltip
      key={key}
      content={renderTooltipContent((props as any).content, key)}
    >
      {renderContainerChildren(children, key) as any}
    </Tooltip>
  ),

  skeleton: (props, _children, key) => {
    const rawH = (props as any).height;
    const height = typeof rawH === 'number' ? rawH : 22;
    return (
      <Skeleton
        key={key}
        height={height as any}
        {...('width' in (props as any) ? { width: (props as any).width } : {})}
        {...('borderRadius' in (props as any)
          ? { borderRadius: asString((props as any).borderRadius) as any }
          : {})}
      />
    );
  },

  link: (props, children, key) => {
    const inl = renderInlineChildren(children, key);
    return (
      <Link key={key} href={asString(props.href)}>
        {inl.length ? (inl as any) : asString(props.children)}
      </Link>
    );
  },
};

/* ------------------------------------------------------------------ */
/* Generic node rendering + public API                                 */
/* ------------------------------------------------------------------ */

/**
 * Render a single UI element using the registry.
 * Unknown types are ignored (return null).
 *
 * @param element The UI element to render.
 * @param key React key.
 * @returns A rendered React node or null.
 */
function renderNode(element: UiElement, key: string): any {
  const render = renderers[element.type];
  if (!render) {
    return null;
  }
  const kids = element.children
    ? ([...element.children] as UiChild[])
    : undefined;
  return render(element.props ?? {}, kids, key);
}

/**
 * Public API: render an array of UI elements under a root <Box/>.
 *
 * @param ui Readonly array of UiElement nodes.
 * @returns A React node tree.
 */
export function renderUI(ui: readonly UiElement[]) {
  const nodes = (ui ?? [])
    .map((element, index) => renderNode(element, `el-${index}`))
    .filter(Boolean);
  return <Box>{nodes}</Box>;
}

/**
 * Standardized error UI used by handlers when API calls fail.
 *
 * @param message Optional user-facing error message.
 * @returns A ready-to-render array of UiElement nodes.
 */
export function errorElements(
  message = 'An error occurred, please try again later',
): UiElement[] {
  return [
    {
      type: 'banner',
      props: { title: 'Error', severity: 'danger' },
      children: [{ type: 'text', props: { children: message } }],
    },
  ];
}
