"use client";
import React, { useState, useEffect, FC, ChangeEvent } from "react";
import { Progress } from "@/components/ui/progress";
import Header from "./Header";
import VideoPreview from "./VideoPreview";
import PropertiesPanel from "./PropertiesPanel";
import Timeline from "./Timeline";
import ExportDialog from "./ExportDialog";

import { useVideos } from "../hooks/useVideos";
import { useMergeConfig } from "../hooks/useMergeConfig";
import { useExport } from "../hooks/useExport";

const VideoStitcher: FC = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  const {
    urls,
    videoDurations,
    selectedIndex,
    activePreview,
    validUrls,
    addUrlField,
    removeUrlField,
    handleUrlChange,
    handleVideoSelect,
    handleFileUpload,
  } = useVideos();

  const { mergeConfig, isReady } = useMergeConfig(videoDurations);
  const { isLoading, downloadLink, handleExportVideo } = useExport(
    validUrls,
    mergeConfig,
    isReady
  );
  const [localDownloadLink, setLocalDownloadLink] = useState<string | null>(
    downloadLink
  );
  useEffect(() => {
    setLocalDownloadLink(downloadLink);
  }, [downloadLink]);

  const clipDurations = videoDurations.map((duration) =>
    Math.ceil(duration * mergeConfig.fps)
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        style={{ display: "none" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          handleFileUpload(e);
          e.target.value = ""; // reset so the same file can be uploaded again
        }}
      />
      <Header
        addUrlField={addUrlField}
        handleExportVideo={handleExportVideo}
        isLoading={isLoading}
        isReady={isReady}
        validUrlsLength={validUrls.length}
        triggerFileInput={triggerFileUpload}
      />
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Video Preview*/}
        <VideoPreview
          activePreview={activePreview}
          isReady={isReady}
          validUrls={validUrls}
          clipDurations={clipDurations}
          mergeConfig={mergeConfig}
        />
        {/*Properties Panel*/}
        <PropertiesPanel
          selectedIndex={selectedIndex}
          urls={urls}
          videoDurations={videoDurations}
          handleUrlChange={handleUrlChange}
        />

        {/* Timeline */}
        <Timeline
          validUrls={validUrls}
          videoDurations={videoDurations}
          selectedIndex={selectedIndex}
          handleVideoSelect={handleVideoSelect}
          removeUrlField={removeUrlField}
        />
      </div>
      {/* Export Dialog*/}
      <ExportDialog
        downloadLink={localDownloadLink}
        setDownloadLink={setLocalDownloadLink}
      />

      {/* Loading Overlay */}

      {isLoading && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Progress value={30} className="w-[60%] mx-auto" />
            <p className="text-xl">Rendering Video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStitcher;
