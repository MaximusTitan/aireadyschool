"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/app/dat/utils/supabaseClient";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

// Define proper Razorpay types
interface RazorpayType {
  new (options: RazorpayOptions): {
    open: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: RazorpayType;
  }
}

// Add these interfaces
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayHandler {
  (response: RazorpayResponse): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: RazorpayHandler;
  prefill: {
    name: string;
    email: string;
    contact: string;
    method?: string;
  };
  notes: {
    school_name: string;
    student_name: string;
    grade: string;
    admission_no: string;
  };
  theme: {
    color: string;
  };
}

// Update the interface for the component props
interface StudentFormProps {
  schoolId: string;
  schoolName: string;
  schoolCity: string;
  paymentRequired: boolean; // Add this prop
}

const StudentForm: React.FC<StudentFormProps> = ({
  schoolId,
  schoolName,
  schoolCity,
  paymentRequired,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parentName: "",
    grade: "",
    admissionNo: "",
    photo: "",
    area: "",
    city: schoolCity || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
  } | null>(null);

  // Update city if schoolCity changes
  React.useEffect(() => {
    if (schoolCity) {
      setFormData((prev) => ({
        ...prev,
        city: schoolCity,
      }));
    }
  }, [schoolCity]);

  React.useEffect(() => {
    // Fetch school details from the database if schoolCity is not provided
    const fetchSchoolDetails = async () => {
      if (!schoolCity && schoolId) {
        try {
          const { data, error } = await supabase
            .from("dat_school_details")
            .select("city")
            .eq("id", schoolId)
            .single();

          if (data && data.city) {
            setFormData((prev) => ({ ...prev, city: data.city }));
          } else if (error) {
            setErrorMsg(
              "Could not retrieve school information. Please try again later."
            );
          }
        } catch {
          // Removed the unused parameter completely
          setErrorMsg("Connection error. Please try again later.");
        }
      }
    };

    fetchSchoolDetails();
  }, [schoolId, schoolCity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const getGroupFromGrade = (grade: string): string => {
    const gradeNum = parseInt(grade);
    if (gradeNum <= 6) return "Group A";
    if (gradeNum <= 8) return "Group B";
    if (gradeNum <= 10) return "Group C";
    return "Group D";
  };

  const handleGradeChange = (value: string) => {
    setFormData({ ...formData, grade: value });
  };

  const registerStudent = async (paymentDetails: {
    orderId: string;
    paymentId: string;
  }) => {
    try {
      // Upload photo first
      let photoURL = "";
      if (photoFile) {
        setUploading(true);
        const fileName = `${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("student-photos")
          .upload(fileName, photoFile);
        if (uploadError) {
          setErrorMsg("Failed to upload photo. Please try again.");
          setUploading(false);
          setIsSubmitting(false);
          return;
        }
        const { data } = supabase.storage
          .from("student-photos")
          .getPublicUrl(fileName);
        photoURL = data.publicUrl;
        setUploading(false);
      }

      // Prepare student data
      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        parent_name: formData.parentName,
        grade: formData.grade,
        group: getGroupFromGrade(formData.grade),
        admission_no: formData.admissionNo,
        photo: photoURL,
        area: formData.area,
        city: formData.city,
        school_id: schoolId,
        school_name: schoolName,
        password: formData.password,
      };

      // Start transaction for student creation and payment recording
      const { data: newStudent, error: insertError } = await supabase
        .from("dat_student_details")
        .insert(studentData)
        .select()
        .single();

      if (insertError || !newStudent) {
        setErrorMsg(insertError?.message || "Failed to create student record");
        setIsSubmitting(false);
        return;
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from("dat_student_payments")
        .insert({
          student_id: newStudent.id,
          order_id: paymentDetails.orderId,
          payment_id: paymentDetails.paymentId,
          amount: 299,
          status: "completed",
        });

      if (paymentError) {
        // If payment recording fails, delete the student record
        await supabase
          .from("dat_student_details")
          .delete()
          .eq("id", newStudent.id);
        setErrorMsg("Payment recording failed");
        return;
      }

      // Create auth user last
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "dat_student",
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        // If auth fails, rollback everything
        await supabase
          .from("dat_student_details")
          .delete()
          .eq("id", newStudent.id);
        setErrorMsg(authError.message);
        setIsSubmitting(false);
        return;
      }

      // After successful registration
      setPaymentDetails({
        orderId: paymentDetails.orderId,
        paymentId: paymentDetails.paymentId,
        amount: 299,
      });
      setIsSuccess(true);

      alert("Check your email for the verification link!");
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg("Registration failed");
    }
  };

  const initializePayment = async () => {
    try {
      const res = await fetch("/api/dat/initPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 299,
          email: formData.email,
          contact: formData.phone,
        }),
      });
      const data = await res.json();

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.amount,
        currency: data.currency,
        name: "DataAndAI Talks",
        description: "Student Registration Fee (₹299)",
        order_id: data.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const { verified } = await verifyRes.json();
            if (verified) {
              await registerStudent({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            } else {
              setErrorMsg("Payment verification failed. Please try again.");
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            setErrorMsg("Payment verification failed. Please try again.");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
          method: "upi",
        },
        notes: {
          school_name: schoolName,
          student_name: formData.name,
          grade: formData.grade,
          admission_no: formData.admissionNo,
        },
        theme: {
          color: "#E11D48", // Rose-600 color
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Payment initialization error:", err);
      setErrorMsg("Failed to initialize payment");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (!schoolId || !schoolName || !formData.city) {
        setErrorMsg(
          "Complete school information is required. Please use a valid registration link."
        );
        setIsSubmitting(false);
        return;
      }

      // Check email duplication
      const res = await fetch("/api/dat/checkEmailDuplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const { exists } = await res.json();

      if (exists) {
        setErrorMsg("Email already exists");
        setIsSubmitting(false);
        return;
      }

      // Double check payment requirement from database
      const { data: schoolData, error: schoolError } = await supabase
        .from("dat_school_details")
        .select("payment_required")
        .eq("id", schoolId)
        .single();

      if (schoolError) {
        setErrorMsg("Failed to verify school details");
        setIsSubmitting(false);
        return;
      }

      // Use the database value to determine payment requirement
      if (schoolData.payment_required) {
        await initializePayment();
      } else {
        await registerStudent({ orderId: "FREE", paymentId: "FREE" });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for registering with DataAndAI Talks. Please check your
              email for the verification link.
            </p>
            {paymentDetails && paymentDetails.orderId !== "FREE" && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Payment Details
                </h3>
                <div className="text-sm text-gray-600">
                  <p>Amount Paid: ₹{paymentDetails.amount}</p>
                  <p>Order ID: {paymentDetails.orderId}</p>
                  <p>Payment ID: {paymentDetails.paymentId}</p>
                </div>
              </div>
            )}
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6 text-rose-600">
            Student Registration
          </h2>

          {/* Add payment status indicator */}
          <div
            className={`mb-4 p-3 rounded-lg ${
              paymentRequired
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                paymentRequired ? "text-yellow-800" : "text-green-800"
              }`}
            >
              {paymentRequired
                ? "Registration fee of ₹299 is required"
                : "Registration is free for this school"}
            </p>
          </div>

          {/* Show warning if school info is missing */}
          {(!schoolName || !formData.city) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                Complete school information is required to register.
              </p>
            </div>
          )}

          <p className="text-gray-600 text-center mb-6">
            Enter student details to create a new account
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="parentName">Parent&apos;s Name</Label>
              <Input
                id="parentName"
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select onValueChange={handleGradeChange} required>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="admissionNo">Admission No</Label>
              <Input
                id="admissionNo"
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelection}
              />
              {uploading && (
                <p className="text-sm text-gray-500">Uploading...</p>
              )}
              {formData.photo && !photoFile && (
                <div className="mt-2">
                  <Image
                    src={formData.photo}
                    alt="Uploaded"
                    width={96}
                    height={96}
                    className="object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
              />
            </div>
            {errorMsg && <p className="text-red-600 text-center">{errorMsg}</p>}
            <div>
              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                disabled={isSubmitting || !schoolName || !formData.city}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">⏳</div>
                    Submitting...
                  </div>
                ) : paymentRequired ? (
                  "Submit & Pay ₹299"
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
