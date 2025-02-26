import { CardContent, CardFooter } from "@/components/ui/card";
import { FormCard, FormInput, FormButton } from "./FormElements";

interface SupabaseConnectionDetails {
  supabaseUrl: string;
  supabaseAnonKey: string;
  databaseName: string;
}

type SupabaseConnectionFormProps = {
  connectionDetails: SupabaseConnectionDetails;
  setConnectionDetails: React.Dispatch<
    React.SetStateAction<SupabaseConnectionDetails>
  >;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
};

const SupabaseConnectionForm = ({
  connectionDetails,
  setConnectionDetails,
  handleSubmit,
  isLoading,
}: SupabaseConnectionFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConnectionDetails({
      ...connectionDetails,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <FormCard
      title="Connect to Supabase"
      description="Enter your Supabase credentials to connect."
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormInput
            label="Supabase URL"
            id="supabaseUrl"
            name="supabaseUrl"
            type="url"
            placeholder="https://your-project.supabase.co"
            value={connectionDetails.supabaseUrl}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Supabase Anon Key"
            id="supabaseAnonKey"
            name="supabaseAnonKey"
            type="password"
            placeholder="Your Supabase Anon Key"
            value={connectionDetails.supabaseAnonKey}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Database Name"
            id="databaseName"
            name="databaseName"
            type="text"
            placeholder="Enter a name for your database connection"
            value={connectionDetails.databaseName}
            onChange={handleChange}
            required
          />
        </CardContent>
        <CardFooter>
          <FormButton type="submit" isLoading={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </FormButton>
        </CardFooter>
      </form>
    </FormCard>
  );
};

export default SupabaseConnectionForm;
