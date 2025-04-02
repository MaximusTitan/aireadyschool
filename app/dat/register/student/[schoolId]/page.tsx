"use client";

import React from "react";
import StudentForm from "@/app/dat/components/forms/StudentForm";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Script from "next/script";

const StudentRegistrationPage = () => {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const [schoolName, setSchoolName] = useState<string>("");
  const [schoolCity, setSchoolCity] = useState<string>("");
  const [paymentRequired, setPaymentRequired] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("dat_school_details")
          .select("school_name, city, status, payment_required")
          .eq("id", schoolId)
          .single();

        if (fetchError || !data) {
          setError("Invalid registration link");
          return;
        }

        if (data.status !== "approved") {
          setError("This school is not currently accepting registrations");
          return;
        }

        setSchoolName(data.school_name);
        setSchoolCity(data.city);
        setPaymentRequired(data.payment_required === true);
      } catch (error) {
        console.error("Failed to load school details:", error);
        setError("Failed to load school details");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchoolDetails();
    }
  }, [schoolId]);

  const goBack = () => window.history.back();

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-8 p-4 text-center">
        <h2 className="text-xl text-red-600 font-bold">{error}</h2>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                Student Registration
              </h1>
              <p className="text-gray-600">Registering for {schoolName}</p>
            </div>
          </div>

          <StudentForm
            schoolId={schoolId}
            schoolName={schoolName}
            schoolCity={schoolCity}
            paymentRequired={paymentRequired}
          />
        </div>
      </div>
    </>
  );
};

export default StudentRegistrationPage;
