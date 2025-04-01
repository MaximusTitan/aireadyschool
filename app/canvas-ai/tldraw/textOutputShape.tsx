import axios from "axios";
import { Move, MessageCircle } from "lucide-react";
import {
  BaseBoxShapeUtil,
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  HTMLContainer,
  T,
  TLBaseShape,
  TLDefaultColorStyle,
  TLDefaultFillStyle,
  TLDefaultSizeStyle,
  TLShape,
  useDefaultColorTheme,
  useEditor,
} from "tldraw";

export type TextOutputShape = TLBaseShape<
  "textOutput",
  {
    w: number;
    h: number;
    size: TLDefaultSizeStyle;
    color: TLDefaultColorStyle;
    fill: TLDefaultFillStyle;
    content: string;
    isLoading: boolean;
  }
>;

export class TextOutputShapeUtil extends BaseBoxShapeUtil<TextOutputShape> {
  static type = "textOutput" as const;

  static override props = {
    w: T.number,
    h: T.number,
    color: DefaultColorStyle,
    fill: DefaultFillStyle,
    content: T.string,
    size: DefaultSizeStyle,
    isLoading: T.boolean,
  };

  getDefaultProps() {
    return {
      color: "violet" as const,
      fill: "solid" as const,
      content: "",
      size: "m" as const,
      w: 300,
      h: 200,
      isLoading: false,
    };
  }

  component(shape: TextOutputShape) {
    const theme = useDefaultColorTheme();
    const editor = useEditor();

    const handleGenerate = async () => {
      try {
        // Create a Set to track processed shapes and avoid duplicates
        const connectedShapes: TLShape[] = [];
        let arrowBindings = editor.getBindingsToShape(shape.id, "arrow");
        arrowBindings = arrowBindings.filter(
          (binding: any) => binding.props.terminal !== "start"
        );

        for (const binding of arrowBindings) {
          const arrowBindings = editor.getBindingsInvolvingShape(
            binding.fromId
          );
          for (const arrowBinding of arrowBindings) {
            if (arrowBinding.toId !== shape.id) {
              const connectedShape = editor.getShape(arrowBinding.toId);
              if (connectedShape) {
                connectedShapes.push(connectedShape);
              }
            }
          }
        }

        // Build prompt from connected text input shapes
        const promptParts = connectedShapes
          .filter((shape) => shape.type === "textInput")
          .map((shape: any) => shape.props.text);

        const topic = promptParts.join("\n");

        if (promptParts.length === 0) {
          console.warn("No connected text input shapes found");
          return;
        }

        this.editor.updateShape({
          id: shape.id,
          type: "textOutput",
          props: {
            ...shape.props,
            isLoading: true,
          },
        });

        const response = await axios.post("/api/canvas-chat", {
          topic,
        });

        this.editor.updateShape<TextOutputShape>({
          id: shape.id,
          type: "textOutput",
          props: {
            ...shape.props,
            isLoading: false,
            content: response.data.answer,
          },
        });
      } catch (error) {
        console.error("Canvas chat generation failed:", error);
        this.editor.updateShape<TextOutputShape>({
          id: shape.id,
          type: "textOutput",
          props: {
            ...shape.props,
            isLoading: false,
            content: "Error: Failed to generate response. Please try again.",
          },
        });
      }
    };

    // Use the same font sizing logic as TextInputShape
    let fontSize = "24px"; // m
    switch (shape.props.size) {
      case "s":
        fontSize = "18px";
        break;
      case "m":
        fontSize = "24px";
        break;
      case "l":
        fontSize = "32px";
        break;
      case "xl":
        fontSize = "48px";
        break;
    }

    const backgroundColor = theme[shape.props.color].solid;
    let headerTextColor = "black";

    switch (shape.props.color) {
      case "black":
      case "red":
      case "blue":
      case "green":
      case "orange":
      case "violet":
        headerTextColor = "white";
        break;
    }

    return (
      <HTMLContainer id={shape.id}>
        <div
          className="rounded-[8px] border-[3px] border-black overflow-hidden flex flex-col text-[16px]"
          style={{
            width: shape.props.w,
            height: shape.props.h,
            fontFamily: "var(--tl-font-draw)",
          }}
        >
          <div className="flex gap-1 items-center px-3 min-h-[40px] bg-white border-b border-gray-200 cursor-move pointer-events-auto">
            <Move />
            <h2>AI Response</h2>
            <div className="flex-1 flex justify-end gap-1">
              <GenerateButton
                onClick={handleGenerate}
                headerTextColor={headerTextColor}
              />
            </div>
          </div>

          <div
            className="p-3 overflow-auto flex-1 w-full h-full bg-white whitespace-pre-wrap pointer-events-auto"
            style={{
              fontSize,
              fontFamily: "var(--tl-font-draw)",
            }}
          >
            {shape.props.isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="60px"
                    viewBox="0 -960 960 960"
                    width="60px"
                    fill="#5f6368"
                  >
                    <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
                  </svg>
                </div>
              </div>
            ) : shape.props.content ? (
              <div className="h-full overflow-auto">{shape.props.content}</div>
            ) : (
              <div className="text-gray-400 flex items-center justify-center h-full">
                Connect to a text input and click the generate button to get a
                response
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: TextOutputShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

function GenerateButton({
  onClick,
  headerTextColor,
}: {
  onClick?: () => void;
  headerTextColor: string;
}) {
  return (
    <button
      className="tlui-button tlui-button__icon absolute top-0 right-0 z-10 pointer-events-auto"
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <MessageCircle />
    </button>
  );
}
