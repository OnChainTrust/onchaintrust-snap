/**
 * UI DSL tests for renderUI()/errorElements() using name-based traversal
 * over an object tree: { type, props, children }.
 * No React DOM assumptions.
 */

import type { UiElement } from '../src/types/ui-schema';
import { renderUI, errorElements } from '../src/ui';

/* -------------------------------------------------------------------------- */
/* Tiny tree helpers (SAFE, no unions returned)                               */
/* -------------------------------------------------------------------------- */

type TypeLike = string | { displayName?: string; name?: string } | any;
type NodeLike = { type: TypeLike; props: Record<string, any>; children?: any };

/**
 * Type guard: is value a NodeLike.
 *
 * @param value Value to check.
 * @returns True if NodeLike.
 */
function isNode(value: any): value is NodeLike {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    'type' in value &&
    'props' in value
  );
}

/**
 * Return children array for a NodeLike (reads either props.children or children).
 * If none, returns [].
 *
 * @param node Node to read from.
 * @returns Children as an array.
 */
function childrenOf(node: NodeLike): any[] {
  const childRaw = (node as any)?.props?.children ?? (node as any)?.children;
  if (childRaw === null || childRaw === undefined) {
    return [];
  }
  return Array.isArray(childRaw) ? childRaw : [childRaw];
}

/**
 * DFS walk over the node tree, visiting each NodeLike.
 *
 * @param node Root node.
 * @param visit Visitor callback invoked for each node.
 */
function walk(node: NodeLike, visit: (m: NodeLike) => void) {
  visit(node);
  for (const child of childrenOf(node)) {
    if (isNode(child)) {
      walk(child, visit);
    }
  }
}

/**
 * Resolve a human-readable type name for a NodeLike.
 *
 * @param node Node to inspect.
 * @returns Type name (case-insensitive comparable).
 */
function typeName(node: NodeLike): string {
  const typeRef = node.type;
  if (typeof typeRef === 'string') {
    return typeRef;
  }
  if (typeRef?.displayName) {
    return String(typeRef.displayName);
  }
  if (typeRef?.name) {
    return String(typeRef.name);
  }
  return '__Unknown__';
}

/**
 * Case-insensitive equality on node's type name.
 *
 * @param node Node to check.
 * @param name Expected name.
 * @returns True if equals (case-insensitive).
 */
function eqName(node: NodeLike, name: string): boolean {
  return typeName(node).toLowerCase() === name.toLowerCase();
}

/**
 * Collect all descendants (including root) with given type name.
 *
 * @param root Root node.
 * @param name Type name to match.
 * @returns Array of matching nodes.
 */
function queryAllByName(root: NodeLike, name: string): NodeLike[] {
  const out: NodeLike[] = [];
  walk(root, (node) => {
    if (eqName(node, name)) {
      out.push(node);
    }
  });
  return out;
}

/**
 * Ensure count >= min and return the array (typed as NodeLike[]).
 *
 * @param root Root node.
 * @param name Type name to query.
 * @param min Minimum expected count (inclusive).
 * @returns All matches.
 */
function getAllByName(root: NodeLike, name: string, min = 1): NodeLike[] {
  const arr = queryAllByName(root, name);
  expect(arr.length).toBeGreaterThanOrEqual(min);
  return arr;
}

/**
 * Return the first node with given name or fail.
 *
 * @param root Root node.
 * @param name Type name to get.
 * @returns First match.
 */
function getByName(root: NodeLike, name: string): NodeLike {
  const arr = queryAllByName(root, name);
  expect(arr.length).toBeGreaterThan(0);
  return at(arr, 0, name); // <- guarantees NodeLike, not undefined
}

/**
 * Assert value is defined and return it (narrows to NodeLike where relevant).
 *
 * @param value Value to check.
 * @param message Error message if undefined/null.
 * @returns The same value (now defined).
 */
function expectDefined<ValueT>(
  value: ValueT | undefined | null,
  message: string,
): ValueT {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value as ValueT;
}

/**
 * Safe index accessor with runtime check, returns T (not T|undefined).
 *
 * @param arr Array to index.
 * @param idx Index to read.
 * @param label Optional label used in error message.
 * @returns Element at index.
 */
function at<ItemT>(arr: ItemT[], idx: number, label = 'Index'): ItemT {
  if (idx < 0 || idx >= arr.length) {
    throw new Error(`${label} ${idx} out of range (len=${arr.length})`);
  }
  return arr[idx] as ItemT;
}

/* Utility: valid 0x…40 for addresses */
const hex40 = (ch: string) => `0x${ch.repeat(40)}`;

/* -------------------------------------------------------------------------- */
/* Custom Jest matchers (reduce boilerplate)                                   */
/* -------------------------------------------------------------------------- */

/**
 * Shallow props subset comparison: actual must contain all keys with exact values.
 *
 * @param actual Actual props.
 * @param subset Expected subset.
 * @returns True if subset matches.
 */
function propsContain(
  actual: Record<string, any>,
  subset: Record<string, any>,
): boolean {
  for (const [key, val] of Object.entries(subset)) {
    if (actual?.[key] !== val) {
      return false;
    }
  }
  return true;
}

expect.extend({
  /**
   * Assert node-like shape
   *
   * @param received Value under test.
   * @returns Jest matcher result object.
   */
  toBeNode(received: any) {
    const pass = isNode(received);
    return {
      pass,
      message: () =>
        pass
          ? 'Expected value NOT to be a NodeLike'
          : 'Expected value to be a NodeLike',
    };
  },

  /**
   * Assert node type equals name (case-insensitive)
   *
   * @param received Node under test.
   * @param expected Expected type name.
   * @returns Jest matcher result object.
   */
  toHaveTypeName(received: NodeLike, expected: string) {
    const tn = typeName(received);
    const pass = tn.toLowerCase() === expected.toLowerCase();
    return {
      pass,
      message: () => `Expected type ${expected}, received ${tn}`,
    };
  },

  /**
   * Assert there exists a descendant of type with optional props subset
   *
   * @param received Root node.
   * @param type Type name to search.
   * @param subset Optional props subset to match.
   * @returns Jest matcher result object.
   */
  toContainNodeWithProps(
    received: NodeLike,
    type: string,
    subset: Record<string, any> | undefined = undefined,
  ) {
    const all = queryAllByName(received, type);
    const pass =
      subset === null || subset === undefined
        ? all.length > 0
        : all.some((node) => propsContain(node.props, subset));
    return {
      pass,
      message: () =>
        `Expected to contain descendant ${type}${
          subset ? ` with props ${JSON.stringify(subset)}` : ''
        }, found ${all.length}`,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* 1) Structure                                                                */
/* -------------------------------------------------------------------------- */

describe('renderUI — structure', () => {
  it('wraps everything into a root <Box>', () => {
    const root = renderUI([
      { type: 'text', props: { children: 'X' } },
    ]) as unknown as NodeLike;
    expect(root).toBeNode();
    expect(root).toHaveTypeName('Box');

    const txt = getByName(root, 'Text');
    expect(txt.props.children).toBe('X');
  });
});

/* -------------------------------------------------------------------------- */
/* 2) Kitchen sink (broad coverage)                                            */
/* -------------------------------------------------------------------------- */

describe('renderUI — kitchen sink', () => {
  it('renders supported elements with correct props/structure', () => {
    const ui: UiElement[] = [
      { type: 'heading', props: { children: 'Hello' } },

      {
        type: 'text',
        props: { children: 'para' },
        children: [
          ' — ',
          { type: 'bold', props: { children: 'B' } },
          ' & ',
          { type: 'italic', props: { children: 'I' } },
          ' ',
          { type: 'icon', props: { name: 'info', size: 'md' } },
        ],
      },

      { type: 'divider' },
      { type: 'spinner' },

      { type: 'copyable', props: { value: 'copy-me' } },
      { type: 'image', props: { src: 'https://img', alt: 'img' } },
      { type: 'icon', props: { name: 'success', size: 'lg' } },

      {
        type: 'address',
        props: {
          address: hex40('1'),
          truncate: true,
          displayName: true,
          avatar: false,
        },
      },

      {
        type: 'avatar',
        props: { address: hex40('2'), chainId: 'eip155:1', size: 'md' },
      },

      {
        type: 'banner',
        props: { title: 'Warn', severity: 'warning' },
        children: [
          {
            type: 'text',
            props: { children: 'Be careful ' },
            children: [{ type: 'bold', props: { children: 'now' } }],
          },
          {
            type: 'link',
            props: { href: 'https://example.com', children: 'link' },
          },
          {
            type: 'button',
            props: { name: 'ok', variant: 'secondary', children: 'OK' },
          },
          { type: 'icon', props: { name: 'info', size: 'md' } },
          { type: 'skeleton', props: { height: 10, width: '100%' } },
          { type: 'italic', props: { children: 'note' } },
        ],
      },

      {
        type: 'button',
        props: {
          type: 'submit',
          name: 'go',
          variant: 'primary',
          children: 'Go',
        },
      },

      {
        type: 'checkbox',
        props: {
          name: 'agree',
          checked: true,
          variant: 'default',
          label: 'Agree',
        },
      },

      {
        type: 'dropdown',
        props: { name: 'select' },
        children: [
          { type: 'option', props: { value: '1', label: 'One' } },
          { type: 'option', props: { value: '2', children: 'Two' } },
        ],
      },

      {
        type: 'form',
        props: { name: 'myform' },
        children: [
          {
            type: 'field',
            props: { label: 'Your name' },
            children: [
              { type: 'input', props: { name: 'name', placeholder: '...' } },
              { type: 'text', props: { children: 'helper' } },
            ],
          },
        ],
      },

      {
        type: 'radiogroup',
        props: { name: 'rg' },
        children: [
          { type: 'radio', props: { value: 'a', children: 'A' } },
          { type: 'radio', props: { value: 'b', children: 'B' } },
        ],
      },

      {
        type: 'row',
        props: { label: 'Label' },
        children: [{ type: 'value', props: { value: '42', extra: 'kg' } }],
      },

      {
        type: 'card',
        props: {
          title: 'Card',
          value: 'v',
          image: 'https://i',
          description: 'desc',
          extra: 'more',
        },
      },

      {
        type: 'section',
        children: [{ type: 'text', props: { children: 'Sec' } }],
      },

      {
        type: 'tooltip',
        props: { content: 'tip' },
        children: [{ type: 'text', props: { children: 'hover me' } }],
      },

      { type: 'skeleton', props: { width: '50%', borderRadius: 'sm' } },

      { type: 'link', props: { href: 'https://x', children: 'Go' } },

      {
        type: 'box',
        props: { direction: 'vertical', center: true },
        children: [{ type: 'text', props: { children: 'Inside' } }],
      },
    ];

    const root = renderUI(ui) as unknown as NodeLike;
    expect(root).toBeNode();
    expect(root).toHaveTypeName('Box');

    // Heading
    expect(getByName(root, 'Heading').props.children).toBe('Hello');

    // Inline bold/italic/icon inside Text
    expect(getAllByName(root, 'Bold').length).toBeGreaterThan(0);
    expect(getAllByName(root, 'Italic').length).toBeGreaterThan(0);
    expect(getAllByName(root, 'Icon').length).toBeGreaterThanOrEqual(2);

    // Divider & Spinner
    expect(getAllByName(root, 'Divider')).toHaveLength(1);
    expect(getAllByName(root, 'Spinner')).toHaveLength(1);

    // Copyable & Image
    expect(getByName(root, 'Copyable').props.value).toBe('copy-me');
    expect(getByName(root, 'Image').props.src).toBe('https://img');

    // Address (valid 0x…40)
    const addr = getByName(root, 'Address');
    expect(addr.props.address).toBe(hex40('1'));
    expect(addr.props.truncate).toBe(true);
    expect(addr.props.displayName).toBe(true);
    expect(addr.props.avatar).toBe(false);

    // Avatar (CAIP-10 derived from 0x + chainId)
    const avatar = getByName(root, 'Avatar');
    expect(avatar.props.address).toBe(`eip155:1:${hex40('2')}`);

    // Banner + whitelisted content
    const banner = getByName(root, 'Banner');
    expect(banner.props.title).toBe('Warn');
    expect(banner.props.severity).toBe('warning');

    expect(root).toContainNodeWithProps('Link', {
      href: 'https://example.com',
    });
    expect(root).toContainNodeWithProps('Button', {
      name: 'ok',
      variant: 'secondary',
    });

    const skBanner = expectDefined(
      getAllByName(banner, 'Skeleton').find((sk) => sk.props.width === '100%'),
      'Banner skeleton not found',
    );
    expect(skBanner.props.height).toBe(10);

    // Button (explicit type should not be overridden)
    const btns = getAllByName(root, 'Button', 2);
    const btn = expectDefined(
      btns.find((b) => b.props?.name === 'go'),
      'Button name=go not found',
    );
    expect(btn.props.type).toBe('submit');
    expect(btn.props.name).toBe('go');
    expect(btn.props.variant).toBe('primary');

    // Checkbox
    const checkbox = getByName(root, 'Checkbox');
    expect(checkbox.props.name).toBe('agree');
    expect(checkbox.props.checked).toBe(true);
    expect(checkbox.props.variant).toBe('default');
    expect(checkbox.props.label).toBe('Agree');

    // Dropdown + Option
    const dd = getByName(root, 'Dropdown');
    expect(dd.props.name).toBe('select');
    const opts = getAllByName(dd, 'Option', 2);
    const opt0 = at(opts, 0, 'Option');
    const opt1 = at(opts, 1, 'Option');
    expect(opts.map((optNode) => optNode.props.value)).toStrictEqual([
      '1',
      '2',
    ]);
    expect(opt0.props.children).toBe('One'); // from label
    expect(opt1.props.children).toBe('Two'); // from children

    // Form > Field > (Input, Text)
    const form = getByName(root, 'Form');
    expect(form.props.name).toBe('myform');
    const field = getByName(form, 'Field');
    expect(field.props.label).toBe('Your name');
    expect(getByName(field, 'Input').props.name).toBe('name');

    // RadioGroup + Radio
    const rg = getByName(root, 'RadioGroup');
    expect(rg.props.name).toBe('rg');
    expect(getAllByName(rg, 'Radio')).toHaveLength(2);

    // Row + Value
    const row = getByName(root, 'Row');
    expect(row.props.label).toBe('Label');
    const val = getByName(row, 'Value');
    expect(val.props.value).toBe('42');
    expect(val.props.extra).toBe('kg');

    // Card
    const card = getByName(root, 'Card');
    expect(card.props.title).toBe('Card');
    expect(card.props.description).toBe('desc');

    // Section
    const section = getByName(root, 'Section');
    expect(getByName(section, 'Text').props.children).toBe('Sec');

    // Tooltip
    const tooltip = getByName(root, 'Tooltip');
    expect(tooltip.props.content).toBe('tip');

    // Skeleton (outside banner) — default height 22
    const skPlain = expectDefined(
      getAllByName(root, 'Skeleton').find((sk) => sk.props.width === '50%'),
      'Plain skeleton not found',
    );
    expect(skPlain.props.height).toBe(22);
    expect(skPlain.props.borderRadius).toBe('sm');

    // Link
    const linkNode = expectDefined(
      getAllByName(root, 'Link').find((ln) => ln.props.href === 'https://x'),
      'Link https://x not found',
    );
    expect(linkNode.props.children).toBe('Go');

    // Inner Box (direction/center; alignment is not passed)
    const innerBox = expectDefined(
      getAllByName(root, 'Box').find(
        // eslint-disable-next-line jest/no-conditional-in-test
        (b) => b !== root && b.props.direction === 'vertical',
      ),
      'Inner Box not found',
    );
    expect(innerBox.props.center).toBe(true);
    expect('alignment' in innerBox.props).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* 3) Inputs & Controls specifics                                              */
/* -------------------------------------------------------------------------- */

describe('renderUI — inputs & controls specifics', () => {
  it('button: explicit type is preserved; default type is "button" if missing', () => {
    const ui: UiElement[] = [
      {
        type: 'button',
        props: { name: 'explicit', type: 'submit', children: 'Send' },
      },
      { type: 'button', props: { name: 'defaulted', children: 'Click' } },
    ];
    const root = renderUI(ui) as unknown as NodeLike;

    const btns = getAllByName(root, 'Button', 2);
    const b0 = at(btns, 0, 'Button');
    const b1 = at(btns, 1, 'Button');

    expect(b0.props.name).toBe('explicit');
    expect(b0.props.type).toBe('submit'); // must NOT be overwritten
    expect(b1.props.name).toBe('defaulted');
    expect(b1.props.type).toBe('button'); // default applied
  });

  it('option: label takes precedence over children; children used as fallback; empty string otherwise', () => {
    const ui: UiElement[] = [
      {
        type: 'dropdown',
        props: { name: 'sel' },
        children: [
          {
            type: 'option',
            props: { value: '1', label: 'Lbl', children: 'Child' },
          }, // label wins
          { type: 'option', props: { value: '2', children: 'ChildOnly' } }, // children used
          { type: 'option', props: { value: '3' } as any }, // fallback -> ''
        ],
      },
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const opts = getAllByName(root, 'Option', 3);
    expect(at(opts, 0, 'Option').props.children).toBe('Lbl');
    expect(at(opts, 1, 'Option').props.children).toBe('ChildOnly');
    expect(at(opts, 2, 'Option').props.children).toBe('');
  });
});

/* -------------------------------------------------------------------------- */
/* 4) Edge cases & validation                                                  */
/* -------------------------------------------------------------------------- */

describe('renderUI — edge cases', () => {
  it('skips unknown element types without crashing', () => {
    const ui: UiElement[] = [
      { type: 'heading', props: { children: 'Ok' } },
      { type: 'unknown-element', props: { foo: 'bar' } } as any, // invalid -> skipped
      { type: 'text', props: { children: 'T' } },
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const top = childrenOf(root).filter(isNode);
    expect(top).toHaveLength(2);
    expect(typeName(at(top, 0, 'top'))).toBe('Heading');
    expect(typeName(at(top, 1, 'top'))).toBe('Text');
  });

  it('address: only 0x…40 or CAIP-10 allowed; invalid skipped', () => {
    const ui: UiElement[] = [
      { type: 'address', props: { address: '0x123' } }, // invalid
      { type: 'address', props: { address: `eip155:1:${hex40('a')}` } }, // ok
      { type: 'address', props: { address: hex40('b') } }, // ok
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const adds = getAllByName(root, 'Address', 2);
    expect(at(adds, 0, 'Address').props.address).toBe(`eip155:1:${hex40('a')}`);
    expect(at(adds, 1, 'Address').props.address).toBe(hex40('b'));
  });

  it.each([
    [
      'requires chainId when only 0x account is given',
      [
        { type: 'avatar', props: { address: hex40('1') } }, // no chainId -> skip
        {
          type: 'avatar',
          props: { address: hex40('2'), chainId: 'eip155:777' },
        }, // ok
        {
          type: 'avatar',
          props: { account: hex40('3'), chainId: 'eip155:1' },
        } as any, // ok
      ] as UiElement[],
      [`eip155:777:${hex40('2')}`, `eip155:1:${hex40('3')}`],
    ],
    [
      'derives CAIP-10 address regardless of "address" vs "account" input',
      [
        {
          type: 'avatar',
          props: { account: hex40('a'), chainId: 'eip155:10' },
        } as any,
        {
          type: 'avatar',
          props: { address: hex40('b'), chainId: 'eip155:10' },
        },
      ] as UiElement[],
      [`eip155:10:${hex40('a')}`, `eip155:10:${hex40('b')}`],
    ],
  ])('avatar: %s', (_title, ui, expectedAddrs) => {
    const root = renderUI(ui) as unknown as NodeLike;
    const avatars = getAllByName(root, 'Avatar', expectedAddrs.length);
    expect(avatars.map((a) => a.props.address)).toStrictEqual(expectedAddrs);
  });

  it('banner: filters body to whitelist and inserts placeholder when empty', () => {
    const ui: UiElement[] = [
      {
        type: 'banner',
        props: { title: 'T1', severity: 'info' },
        children: [
          {
            type: 'box',
            children: [{ type: 'text', props: { children: 'nope' } }],
          } as any, // disallowed -> filtered
          { type: 'text', props: { children: 'ok' } },
        ],
      },
      { type: 'banner', props: { title: 'T2', severity: 'danger' } }, // no children -> placeholder Text('')
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const banners = getAllByName(root, 'Banner', 2);
    const b1 = at(banners, 0, 'Banner');
    const b2 = at(banners, 1, 'Banner');

    expect(getAllByName(b1, 'Box', 0)).toHaveLength(0);
    const hasOk = getAllByName(b1, 'Text', 0).some(
      (textNode) => textNode.props.children === 'ok',
    );
    expect(hasOk).toBe(true);

    const hasPlaceholder = getAllByName(b2, 'Text', 0).some(
      (textNode) => textNode.props.children === '',
    );
    expect(hasPlaceholder).toBe(true);
  });

  it('row: placeholder Text("") when child undefined; disallows non-whitelisted types', () => {
    const ui: UiElement[] = [
      { type: 'row', props: { label: 'A' }, children: [undefined] } as any,
      {
        type: 'row',
        props: { label: 'B' },
        children: [{ type: 'button', props: { children: 'Nope' } }],
      } as any,
      {
        type: 'row',
        props: { label: 'C' },
        children: [{ type: 'link', props: { href: '#', children: 'ok' } }],
      },
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const rows = getAllByName(root, 'Row', 3);
    const rowA = at(rows, 0, 'Row');
    const rowB = at(rows, 1, 'Row');
    const rowC = at(rows, 2, 'Row');

    expect(
      getAllByName(rowA, 'Text', 0).some(
        (textNode) => textNode.props.children === '',
      ),
    ).toBe(true);
    expect(getAllByName(rowB, 'Value', 0)).toHaveLength(0);
    expect(getAllByName(rowB, 'Link', 0)).toHaveLength(0);

    const link = getByName(rowC, 'Link');
    expect(link.props.href).toBe('#');
    expect(link.props.children).toBe('ok');
  });

  it('skeleton: height falls back to 22 when non-number provided', () => {
    const ui: UiElement[] = [
      { type: 'skeleton', props: { height: 'bad', width: '10%' } as any },
    ];
    const root = renderUI(ui) as unknown as NodeLike;
    const sk = getByName(root, 'Skeleton');
    expect(sk.props.height).toBe(22);
    expect(sk.props.width).toBe('10%');
  });

  it('inline children take precedence over props.children (Button/Link/Text), and default button type applies', () => {
    const ui: UiElement[] = [
      {
        type: 'button',
        props: { children: 'fallback', name: 'b1' },
        children: [{ type: 'bold', props: { children: 'INLINE' } }],
      },
      { type: 'button', props: { children: 'fallback2', name: 'b2' } },
      {
        type: 'link',
        props: { href: '#', children: 'fallback' },
        children: [{ type: 'italic', props: { children: 'i' } }],
      },
      {
        type: 'text',
        props: { children: 'fallback' },
        children: [{ type: 'icon', props: { name: 'info', size: 'sm' } }],
      },
    ];
    const root = renderUI(ui) as unknown as NodeLike;

    const btns = getAllByName(root, 'Button', 2);
    // inline > props.children
    expect(getAllByName(at(btns, 0, 'Button'), 'Bold', 0)).toHaveLength(1);
    const b1 = at(btns, 1, 'Button');
    expect(typeof b1.props.children).toBe('string');
    expect(b1.props.children).toBe('fallback2');
    expect(b1.props.type).toBe('button'); // default applied

    const lnk = getByName(root, 'Link');
    expect(getAllByName(lnk, 'Italic', 0)).toHaveLength(1);

    const textWithIcon = expectDefined(
      getAllByName(root, 'Text', 0).find(
        (textNode) => getAllByName(textNode, 'Icon', 0).length === 1,
      ),
      'Text-with-Icon not found',
    );
    expect(getAllByName(textWithIcon, 'Icon', 0)).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
/* 5) errorElements                                                            */
/* -------------------------------------------------------------------------- */

describe('errorElements', () => {
  it('produces a danger Banner with default message', () => {
    const root = renderUI(errorElements()) as unknown as NodeLike;
    const b = getByName(root, 'Banner');
    expect(b.props.severity).toBe('danger');
    expect(b.props.title).toBe('Error');
    const hasDefault = getAllByName(b, 'Text', 0).some(
      (textNode) =>
        // eslint-disable-next-line jest/no-conditional-in-test
        typeof textNode.props.children === 'string' &&
        textNode.props.children.includes('error'),
    );
    expect(hasDefault).toBe(true);
  });

  it('supports custom message', () => {
    const root = renderUI(errorElements('Boom')) as unknown as NodeLike;
    const b = getByName(root, 'Banner');
    const hasBoom = getAllByName(b, 'Text', 0).some(
      (textNode) => textNode.props.children === 'Boom',
    );
    expect(hasBoom).toBe(true);
  });
});
