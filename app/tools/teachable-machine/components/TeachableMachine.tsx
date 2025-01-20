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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { RenameClassDialog } from "../components/RenameClassDialog";

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
      description: `${files.length} images have been processed and added to ${classLabel}.`,
    });
  };

  const handleTestImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!net || !classifier) return;

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading model...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Link href="/tools" className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Teachable Machine</h1>
      </div>
      <Card className="w-full ">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["A", "B"].map((classLabel) => (
              <div key={classLabel} className="space-y-2">
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
                    className="w-full max-w-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload {classLabel === "A" ? classAName : classBName}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {classLabel === "A" ? classASamples : classBSamples} images
                </p>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {(classLabel === "A" ? classAImages : classBImages)
                    .slice(-4)
                    .map((src, index) => (
                      <img
                        key={index}
                        src={src || "/placeholder.svg"}
                        alt={`${classLabel === "A" ? classAName : classBName} sample`}
                        className="w-full h-16 object-cover rounded"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="upload-test-image"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Upload Test Image
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="upload-test-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleTestImage}
                disabled={
                  isProcessing || (classASamples === 0 && classBSamples === 0)
                }
              />
              <Button
                onClick={() =>
                  document.getElementById("upload-test-image")?.click()
                }
                disabled={
                  isProcessing || (classASamples === 0 && classBSamples === 0)
                }
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                Test Image
              </Button>
            </div>
          </div>
          {testImage && (
            <div className="mt-4">
              <img
                src={testImage || "/placeholder.svg"}
                alt="Test image"
                className="w-full h-48 object-contain rounded"
              />
            </div>
          )}
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
          <Button onClick={handleRestart} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart Teachable Machine
          </Button>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
