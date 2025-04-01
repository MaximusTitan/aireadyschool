import axios from "axios";
import { Move, Image as ImageIcon } from "lucide-react";
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

export type AspectRatioType =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | "custom";

export type ImageOutputShape = TLBaseShape<
  "imageOutput",
  {
    w: number;
    h: number;
    size: TLDefaultSizeStyle;
    color: TLDefaultColorStyle;
    fill: TLDefaultFillStyle;
    imageUrl: string;
    isLoading: boolean;
    aspectRatio: AspectRatioType;
    numImages: number;
    numInferenceSteps: number;
    customWidth: number;
    customHeight: number;
  }
>;

export class ImageOutputShapeUtil extends BaseBoxShapeUtil<ImageOutputShape> {
  static type = "imageOutput" as const;

  static override props = {
    w: T.number,
    h: T.number,
    color: DefaultColorStyle,
    fill: DefaultFillStyle,
    imageUrl: T.string,
    size: DefaultSizeStyle,
    isLoading: T.boolean,
    aspectRatio: T.string,
    numImages: T.number,
    numInferenceSteps: T.number,
    customWidth: T.number,
    customHeight: T.number,
  };

  getDefaultProps() {
    return {
      w: 600,
      h: 400,
      color: "blue" as const,
      fill: "solid" as const,
      imageUrl: "",
      size: "m" as const,
      isLoading: false,
      aspectRatio: "square_hd" as AspectRatioType,
      numImages: 1,
      numInferenceSteps: 5,
      customWidth: 1024,
      customHeight: 1024,
    };
  }

  component(shape: ImageOutputShape) {
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

        const prompt = promptParts.join("\n");

        if (promptParts.length === 0) {
          console.warn("No connected text input shapes found");
          return;
        }

        this.editor.updateShape({
          id: shape.id,
          type: "imageOutput",
          props: {
            ...shape.props,
            isLoading: true,
          },
        });

        // Prepare image_size parameter based on aspectRatio
        let image_size;
        if (shape.props.aspectRatio === "custom") {
          image_size = {
            width: shape.props.customWidth,
            height: shape.props.customHeight,
          };
        } else {
          image_size = shape.props.aspectRatio;
        }

        const response = await axios.post("/api/image", {
          prompt,
          image_size,
          num_inference_steps: shape.props.numInferenceSteps,
          num_images: shape.props.numImages,
          enable_safety_checker: true,
        });

        // Extract image from the new response format
        const imageData = response.data.images && response.data.images[0];

        if (imageData && imageData.url) {
          this.editor.updateShape<ImageOutputShape>({
            id: shape.id,
            type: "imageOutput",
            props: {
              ...shape.props,
              isLoading: false,
              imageUrl: imageData.url,
            },
          });
        } else {
          throw new Error("No image returned from API");
        }
      } catch (error) {
        console.error("Image generation failed:", error);
        this.editor.updateShape<ImageOutputShape>({
          id: shape.id,
          type: "imageOutput",
          props: {
            ...shape.props,
            isLoading: false,
          },
        });
      }
    };

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

    const handleAspectRatioChange = (
      e: React.ChangeEvent<HTMLSelectElement>
    ) => {
      editor.updateShape({
        id: shape.id,
        type: "imageOutput",
        props: {
          aspectRatio: e.target.value as AspectRatioType,
        },
      });
    };

    const handleCustomWidthChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value > 0) {
        editor.updateShape({
          id: shape.id,
          type: "imageOutput",
          props: {
            customWidth: value,
          },
        });
      }
    };

    const handleCustomHeightChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value > 0) {
        editor.updateShape({
          id: shape.id,
          type: "imageOutput",
          props: {
            customHeight: value,
          },
        });
      }
    };

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
          <div className="flex items-center justify-between px-3 min-h-[40px] border-b border-gray-200 cursor-move pointer-events-auto">
            <div className="flex gap-1 items-center">
              <Move />
              <h2>AI Image</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-transparent text-sm border border-white/30 rounded p-1 pointer-events-auto"
                value={shape.props.aspectRatio}
                onChange={handleAspectRatioChange}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="square_hd">Square HD</option>
                <option value="square">Square</option>
                <option value="portrait_4_3">Portrait 4:3</option>
                <option value="portrait_16_9">Portrait 16:9</option>
                <option value="landscape_4_3">Landscape 4:3</option>
                <option value="landscape_16_9">Landscape 16:9</option>
                <option value="custom">Custom</option>
              </select>
              <GenerateButton
                onClick={handleGenerate}
                headerTextColor={headerTextColor}
              />
            </div>
          </div>

          {shape.props.aspectRatio === "custom" && (
            <div className="flex items-center justify-center gap-2 p-2 bg-white/10 border-b border-gray-200 pointer-events-auto">
              <div className="flex items-center">
                <label className="text-xs mr-1">W:</label>
                <input
                  type="number"
                  className="w-16 text-sm p-1 border rounded"
                  value={shape.props.customWidth}
                  onChange={handleCustomWidthChange}
                  onPointerDown={(e) => e.stopPropagation()}
                  min="32"
                  max="2048"
                />
              </div>
              <div className="flex items-center">
                <label className="text-xs mr-1">H:</label>
                <input
                  type="number"
                  className="w-16 text-sm p-1 border rounded"
                  value={shape.props.customHeight}
                  onChange={handleCustomHeightChange}
                  onPointerDown={(e) => e.stopPropagation()}
                  min="32"
                  max="2048"
                />
              </div>
            </div>
          )}

          <div
            className="flex-1 w-full h-full bg-white/10 flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: "#f5f5f5",
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
            ) : shape.props.imageUrl ? (
              <img
                src={shape.props.imageUrl}
                alt="Generated image"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center justify-center h-full p-4 text-center">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p>
                  Connect to a text input and click the generate button to
                  create an image
                </p>
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ImageOutputShape) {
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
      className="tlui-button tlui-button__icon pointer-events-auto"
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <ImageIcon />
    </button>
  );
}
