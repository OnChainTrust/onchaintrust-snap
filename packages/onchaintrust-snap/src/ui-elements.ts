import { NodeType } from '@metamask/snaps-sdk';

type HeadingElement = {
  type: NodeType.Heading;
  value: string;
};

type TextElement = {
  type: NodeType.Text;
  value: string;
  markdown?: boolean | undefined;
};

type DividerElement = {
  type: NodeType.Divider;
};

type CopyableElement = {
  type: NodeType.Copyable;
  value: string;
  sensitive?: boolean | undefined;
};

type ImageElement = {
  type: NodeType.Image;
  value: string;
};

export type UiElement =
  | HeadingElement
  | TextElement
  | DividerElement
  | CopyableElement
  | ImageElement;
