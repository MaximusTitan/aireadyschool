"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Check } from 'lucide-react';

export default function PendingApproval() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        className="hover:bg-gray-100"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
      </Button>
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mb-6">
            <Check className="h-16 w-16 text-yellow-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Registration Under Review</h1>
          <p className="text-gray-600 mb-4">
            Thank you for registering your school. Your application is currently under review by our admin team.
            You will receive an email notification once your registration has been approved.
          </p>
          <p className="text-sm text-gray-500">
            This usually takes 1-2 business days. If you have any questions, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
