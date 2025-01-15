import { Check } from "lucide-react";

interface StepperProps {
  steps: { title: string; fields: string[] }[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      {steps.map((step, index) => (
        <div key={step.title} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              index <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground text-muted-foreground"
            }`}
          >
            {index < currentStep ? (
              <Check className="h-5 w-5" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              index <= currentStep ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`ml-2 h-px w-8 ${
                index < currentStep ? "bg-primary" : "bg-muted-foreground"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
