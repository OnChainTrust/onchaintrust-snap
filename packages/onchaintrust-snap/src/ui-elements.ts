import { NodeType } from "@metamask/snaps-sdk";

interface HeadingElement {
    type: NodeType.Heading;
    value: string;
}

interface TextElement {
    type: NodeType.Text;
    value: string;
    markdown?: boolean | undefined;
}

interface DividerElement {
    type: NodeType.Divider;
}

interface CopyableElement {
    type: NodeType.Copyable;
    value: string;
    sensitive?: boolean | undefined;
}

interface ImageElement {
    type: NodeType.Image;
    value: string;
}

export type UiElement = HeadingElement | TextElement | DividerElement | CopyableElement | ImageElement;
