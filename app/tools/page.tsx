import React from "react";

const ToolList: React.FC = () => {
  const tools = ["Hammer", "Screwdriver", "Wrench", "Pliers"];

  return (
    <ul>
      {tools.map((tool, index) => (
        <li key={index}>{tool}</li>
      ))}
    </ul>
  );
};

const ToolsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <h1>Tools</h1>
        <p>Welcome to the Tools page!</p>
        <ToolList />
      </div>
    </div>
  );
};

export default ToolsPage;
