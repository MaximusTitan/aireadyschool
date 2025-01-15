import { z } from "zod";

export interface IEPFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

// Define formSchema in the same file or import it if defined elsewhere
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  syllabus: z
    .string()
    .min(2, { message: "Syllabus must be at least 2 characters." }),
  strengths: z
    .string()
    .min(10, { message: "Strengths must be at least 10 characters." }),
  weaknesses: z.string().min(10, {
    message: "Areas for improvement must be at least 10 characters.",
  }),
});