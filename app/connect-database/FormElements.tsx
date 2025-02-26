import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormInputProps extends React.ComponentProps<typeof Input> {
  label: string;
}
interface FormButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  type?: "submit" | "button" | "reset";
}

const FormCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <Card className="max-w-md mx-auto">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    {children}
  </Card>
);

const FormInput = ({ label, ...props }: FormInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={props.id}>{label}</Label>
    <Input {...props} />
  </div>
);

const ConnectionAlert = ({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) => (
  <Alert variant={success ? "default" : "destructive"}>
    {success ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <AlertCircle className="h-4 w-4" />
    )}
    <AlertTitle>{success ? "Success" : "Error"}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

const FormButton = ({
  isLoading,
  children,
  type = "button",
}: FormButtonProps) => (
  <Button type={type} className="w-full" disabled={isLoading}>
    {isLoading ? "Connecting..." : children}
  </Button>
);

export { FormCard, FormInput, ConnectionAlert, FormButton };
