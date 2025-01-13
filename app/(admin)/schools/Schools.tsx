"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Table } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { Trash } from "lucide-react";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { addDomainToVercel } from "@/utils/vercel/add-domain";

const supabase = createClient();

const SchoolsPage = () => {
  const form = useForm<SchoolFormData>();
  const [newSchool, setNewSchool] = useState({ name: "", site_id: "" });
  const [schools, setSchools] = useState<School[]>([]);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    id: number | null;
  }>({ open: false, id: null });

  interface School {
    id: number;
    name: string;
    site_id: string;
  }

  interface SchoolFormData {
    name: string;
    site_id: string;
  }

  const addSchool = async (data: SchoolFormData): Promise<void> => {
    setIsLoading(true);
    const subdomain = data.site_id;
    const fullDomain = `${subdomain}.aireadyschool.com`;
    const { error } = await supabase
      .from("schools")
      .insert([{ name: data.name, site_id: subdomain }]);
    if (error) {
      console.error("Error adding school:", error.message, error.details);
    } else {
      await addDomainToVercel(fullDomain);
      // Optionally fetch updated schools
      fetchSchools();
      form.reset();
      setIsAddModalOpen(false); // Close Add Dialog
    }
    setIsLoading(false);
  };

  const updateSchool = async (data: SchoolFormData): Promise<void> => {
    setIsLoading(true);
    if (!editingSchool) return;
    const subdomain = data.site_id;
    const fullDomain = `${subdomain}.aireadyschool.com`;
    const { error } = await supabase
      .from("schools")
      .update({ name: data.name, site_id: subdomain })
      .eq("id", editingSchool.id);
    if (error) {
      console.error("Error updating school:", error.message, error.details);
    } else {
      await addDomainToVercel(fullDomain);
      fetchSchools();
      form.reset();
      setEditingSchool(null);
      setIsEditModalOpen(false); // Close Edit Dialog
    }
    setIsLoading(false);
  };

  const fetchSchools = async () => {
    const { data, error } = await supabase.from("schools").select("*");
    if (error) {
      console.error("Error fetching schools:", error.message, error.details);
    } else {
      setSchools(data);
    }
  };

  const deleteSchool = async (id: number): Promise<void> => {
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) {
      console.error("Error deleting school:", error.message, error.details);
    } else {
      fetchSchools();
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmation({ open: true, id });
  };

  const confirmDeleteSchool = async () => {
    if (deleteConfirmation.id !== null) {
      setIsLoading(true);
      await deleteSchool(deleteConfirmation.id);
      setDeleteConfirmation({ open: false, id: null });
      setIsLoading(false);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    form.reset({
      name: school.name,
      site_id: school.site_id,
    });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Schools</h1>

      <Button onClick={() => setIsAddModalOpen(true)} className="mb-4">
        Add New School
      </Button>

      {isLoading && <Progress className="mb-4" />}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Enter the details of the new school.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(addSchool)}
            className="flex flex-col space-y-4"
          >
            <div className="flex flex-col">
              <label htmlFor="name" className="font-semibold mb-1">
                School Name
              </label>
              <Input
                id="name"
                placeholder="School Name"
                {...form.register("name")}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="site_id" className="font-semibold mb-1">
                Subdomain
              </label>
              <div className="flex">
                <Input
                  id="site_id"
                  type="text"
                  placeholder="domainid"
                  {...form.register("site_id", {
                    required: true,
                    pattern: /^[a-z]+$/,
                  })}
                />
                <div className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                  .aireadyschool.com
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Add School
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update the details of the school.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(updateSchool)}
            className="flex flex-col space-y-4"
          >
            <div className="flex flex-col">
              <label htmlFor="name" className="font-semibold mb-1">
                School Name
              </label>
              <Input
                id="name"
                placeholder="School Name"
                {...form.register("name")}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="site_id" className="font-semibold mb-1">
                Subdomain
              </label>
              <div className="flex">
                <Input
                  id="site_id"
                  type="text"
                  placeholder="domainid"
                  {...form.register("site_id", {
                    required: true,
                    pattern: /^[a-z]+$/,
                  })}
                />
                <div className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                  .aireadyschool.com
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Update School
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation({ open, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this school? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteSchool}>
              Delete
            </Button>
            <Button
              onClick={() => setDeleteConfirmation({ open: false, id: null })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Name</th>
            <th className="text-left">Subdomain</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => (
            <tr key={school.id} className="border-t">
              <td>{school.name}</td>
              <td>{school.site_id}</td>
              <td>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(school)}
                >
                  <Edit size={8} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(school.id)}
                >
                  <Trash size={8} />
                </Button>
              </td>
            </tr>
          ))}
          {/* Render schools */}
        </tbody>
      </Table>
    </div>
  );
};

export default SchoolsPage;
