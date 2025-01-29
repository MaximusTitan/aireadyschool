"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import * as tf from "@tensorflow/tfjs";
import * as mobilenetModule from "@tensorflow-models/mobilenet";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  Upload,
  ImageIcon,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { RenameClassDialog } from "../components/RenameClassDialog";
import { RefreshCcw } from "lucide-react";

export default function TeachableMachine() {
  const [net, setNet] = useState<mobilenetModule.MobileNet | null>(null);
  const [classifier, setClassifier] =
    useState<knnClassifier.KNNClassifier | null>(null);
  const [result, setResult] = useState<{
    label: string;
    confidences: { [key: string]: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [classASamples, setClassASamples] = useState<number>(0);
  const [classBSamples, setClassBSamples] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [classAImages, setClassAImages] = useState<string[]>([]);
  const [classBImages, setClassBImages] = useState<string[]>([]);
  const [testImage, setTestImage] = useState<string | null>(null);
  const [classAName, setClassAName] = useState<string>("Class A");
  const [classBName, setClassBName] = useState<string>("Class B");
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [untrained, setUntrained] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  useEffect(() => {
    async function loadModel() {
      const classifier = knnClassifier.create();
      const net = await mobilenetModule.load();
      setClassifier(classifier);
      setNet(net);
      setIsLoading(false);
      toast({
        title: "Model loaded",
        description: "The teachable machine is ready to use.",
      });
    }
    loadModel();
  }, []);

  const processImage = async (imageFile: File, label: string) => {
    if (!net || !classifier) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    return new Promise<void>((resolve) => {
      img.onload = async () => {
        const imgTensor = tf.browser
          .fromPixels(img)
          .resizeBilinear([224, 224])
          .toFloat()
          .expandDims(0);
        const activation = net.infer(imgTensor, true);
        classifier.addExample(activation, label);
        resolve();
      };
    });
  };

  const handleClassUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    classLabel: string
  ) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    setUntrained(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      await processImage(files[i], classLabel);
      newImages.push(URL.createObjectURL(files[i]));
    }
    if (classLabel === classAName) {
      setClassASamples((prev) => prev + files.length);
      setClassAImages((prev) => [...prev, ...newImages]);
    } else {
      setClassBSamples((prev) => prev + files.length);
      setClassBImages((prev) => [...prev, ...newImages]);
    }
    setIsProcessing(false);
    toast({
      title: `${classLabel} images added`,
      description: `${files.length} images have been added. Click 'Train Model' to process them.`,
    });
  };

  const handleDragOver = (e: React.DragEvent, classLabel: string) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent, classLabel: string) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setUntrained(true);
    const newImages: string[] = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        await processImage(file, classLabel);
        newImages.push(URL.createObjectURL(file));
      }
    }

    if (classLabel === classAName) {
      setClassASamples((prev) => prev + newImages.length);
      setClassAImages((prev) => [...prev, ...newImages]);
    } else {
      setClassBSamples((prev) => prev + newImages.length);
      setClassBImages((prev) => [...prev, ...newImages]);
    }
    setIsProcessing(false);
    toast({
      title: `${classLabel} images added`,
      description: `${newImages.length} images have been added. Click 'Train Model' to process them.`,
    });
  };

  const handleTraining = async () => {
    if (!classifier) return;

    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setTrainingProgress(i);
    }

    // Final processing
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsTraining(false);
    setTrainingProgress(100);
    setUntrained(false);

    toast({
      title: "Training Complete",
      description: "The model has been trained and is ready for testing.",
    });
  };

  const handleTestImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!net || !classifier || untrained) {
      toast({
        title: "Training Required",
        description: "Please train the model before testing images.",
        variant: "destructive",
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);
    setTestImage(img.src);

    img.onload = async () => {
      const imgTensor = tf.browser
        .fromPixels(img)
        .resizeBilinear([224, 224])
        .toFloat()
        .expandDims(0);
      const activation = net.infer(imgTensor, true);

      const result = await classifier.predictClass(activation);
      const updatedResult = {
        ...result,
        confidences: {
          [classAName]: result.confidences[classAName] || 0,
          [classBName]: result.confidences[classBName] || 0,
        },
        label: result.label === classAName ? classAName : classBName,
      };
      setResult(updatedResult);
      setIsProcessing(false);
      toast({
        title: "Prediction complete",
        description: `The image has been classified as ${updatedResult.label}.`,
      });
    };
  };

  const handleRestart = () => {
    setClassifier(knnClassifier.create());
    setClassASamples(0);
    setClassBSamples(0);
    setClassAImages([]);
    setClassBImages([]);
    setTestImage(null);
    setResult(null);
    setClassAName("Class A");
    setClassBName("Class B");
    toast({
      title: "Teachable machine reset",
      description:
        "The teachable machine has been reset. You can start training from scratch.",
    });
  };

  const handleRenameClass = (classLabel: "A" | "B", newName: string) => {
    const oldName = classLabel === "A" ? classAName : classBName;
    if (classLabel === "A") {
      setClassAName(newName);
    } else {
      setClassBName(newName);
    }
    if (result) {
      setResult((prevResult) => {
        if (!prevResult) return prevResult;
        return {
          ...prevResult,
          confidences: {
            ...prevResult.confidences,
            [newName]: prevResult.confidences[oldName],
          },
          label: prevResult.label === oldName ? newName : prevResult.label,
        };
      });
    }
    toast({
      title: "Class renamed",
      description: `Class ${classLabel} has been renamed to ${newName}.`,
    });
  };

  const clearClassImages = (classLabel: "A" | "B") => {
    if (classLabel === "A") {
      setClassAImages([]);
      setClassASamples(0);
    } else {
      setClassBImages([]);
      setClassBSamples(0);
    }
    setUntrained(false);
    toast({
      title: `${classLabel === "A" ? classAName : classBName} images cleared`,
      description: "All images have been removed from this class.",
    });
  };

  const clearTestImage = () => {
    setTestImage(null);
    setResult(null);
    toast({
      title: "Test image cleared",
      description: "The test image and results have been cleared.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading model...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/tools" className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Teachable Machine</h1>
      </div>
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["A", "B"].map((classLabel) => (
              <div key={classLabel}>
                <div
                  className={`space-y-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                    isDraggingOver
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onDragOver={(e) =>
                    handleDragOver(
                      e,
                      classLabel === "A" ? classAName : classBName
                    )
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={(e) =>
                    handleDrop(e, classLabel === "A" ? classAName : classBName)
                  }
                >
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor={`upload-class-${classLabel.toLowerCase()}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      {classLabel === "A" ? classAName : classBName}
                    </label>
                    <RenameClassDialog
                      currentName={classLabel === "A" ? classAName : classBName}
                      onRename={(newName) =>
                        handleRenameClass(classLabel as "A" | "B", newName)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Input
                      id={`upload-class-${classLabel.toLowerCase()}`}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleClassUpload(
                          e,
                          classLabel === "A" ? classAName : classBName
                        )
                      }
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={() =>
                        document
                          .getElementById(
                            `upload-class-${classLabel.toLowerCase()}`
                          )
                          ?.click()
                      }
                      disabled={isProcessing}
                      className="w-full max-w-xs bg-neutral-800 hover:bg-neutral-700 text-white"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload {classLabel === "A" ? classAName : classBName}
                    </Button>
                  </div>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Drag and drop images or click to upload
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {classLabel === "A" ? classASamples : classBSamples} images
                  </p>
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {(classLabel === "A" ? classAImages : classBImages)
                        .slice(-4)
                        .map((src, index) => (
                          <img
                            key={index}
                            src={src || "/placeholder.svg"}
                            alt={`${
                              classLabel === "A" ? classAName : classBName
                            } sample`}
                            className="w-full h-16 object-cover rounded"
                          />
                        ))}
                    </div>
                    {((classLabel === "A" && classASamples > 0) ||
                      (classLabel === "B" && classBSamples > 0)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() =>
                          clearClassImages(classLabel as "A" | "B")
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(classASamples > 0 || classBSamples > 0) && (
            <div className="space-y-2">
              <Button
                className="w-full relative"
                onClick={handleTraining}
                disabled={isTraining || !untrained}
              >
                {isTraining ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Training... ({trainingProgress}%)
                  </>
                ) : untrained ? (
                  "Train Model"
                ) : (
                  "Model Trained"
                )}
              </Button>
              {isTraining && (
                <Progress
                  value={trainingProgress}
                  className="w-full transition-all duration-300"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                untrained || (classASamples === 0 && classBSamples === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:border-primary hover:bg-primary/10"
              }`}
              onClick={() => {
                if (!untrained && (classASamples > 0 || classBSamples > 0)) {
                  document.getElementById("upload-test-image")?.click();
                }
              }}
              onDragOver={(e) => !untrained && handleDragOver(e, "test")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                if (!untrained && e.dataTransfer.files?.[0]) {
                  const event = {
                    target: {
                      files: e.dataTransfer.files,
                    },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleTestImage(event);
                }
              }}
            >
              <Input
                id="upload-test-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleTestImage}
                disabled={
                  isProcessing ||
                  isTraining ||
                  untrained ||
                  (classASamples === 0 && classBSamples === 0)
                }
              />
              {testImage ? (
                <>
                  <img
                    src={testImage}
                    alt="Test"
                    className="max-h-48 mx-auto object-contain"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearTestImage();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Drag and drop an image here or click to test</p>
                </>
              )}
            </div>
          </div>

          {result && (
            <div className="mt-6 space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Prediction Results:</h3>
              {[classAName, classBName].map((className) => (
                <div key={className} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{className}</span>
                    <span className="text-sm">
                      {(result.confidences[className] * 100).toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={result.confidences[className] * 100}
                    className="w-full"
                  />
                </div>
              ))}
              <p className="text-center font-semibold mt-4">
                Predicted Class: {result.label}
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleRestart}
              className="text-white hover:text-white bg-neutral-800 hover:bg-neutral-600"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Teachable Machine
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
