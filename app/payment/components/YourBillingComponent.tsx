// import Script from "next/script";
// import { useState, useEffect } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { Check, Loader2, AlertTriangle, CalendarIcon, RefreshCw } from "lucide-react";

// // Define Razorpay types
// interface RazorpayResponse {
//   razorpay_payment_id: string;
//   razorpay_order_id: string;
//   razorpay_signature: string;
// }

// interface RazorpayOptions {
//   name: string;
//   currency: string;
//   order_id: string;
//   description: string;
//   subscription_id: string; // Added subscription ID
//   handler: (response: RazorpayResponse) => void;
// }

// interface RazorpayInstance {
//   open: () => void;
//   on: (event: string, callback: (response: RazorpayErrorResponse) => void) => void;
// }

// interface RazorpayErrorResponse {
//   error: {
//     code: string;
//     description: string;
//   };
// }

// // Define subscription plan types
// interface SubscriptionPlan {
//   id: string;
//   type: string;
//   price: number;
//   priceDisplay: string;
//   credits: {
//     videos: number;
//     images: number;
//     text: string;
//   };
//   features: string[];
// }

// // Define user subscription type
// interface UserSubscription {
//   id: string;
//   plan_id: string;
//   status: string; // Can be: created, authenticated, active, pending, halted, cancelled, completed, expired
//   created_at: string;
//   updated_at: string;
//   meta_data?: any;
//   razorpay_subscription_id?: string;
//   plan?: {
//     type: string;
//     price: number;
//     price_display: string;
//     credits: {
//       videos: number;
//       images: number;
//       text: string;
//     };
//     features: string[];
//   };
// }

// // Subscription plans data
// const subscriptionPlans: SubscriptionPlan[] = [
//   {
//     id: "student_plan",
//     type: "Student",
//     price: 99900,
//     priceDisplay: "Rs.999.00 per month",
//     credits: {
//       videos: 25,
//       images: 500,
//       text: "Unlimited",
//     },
//     features: ["Access to all AI tools", "Priority support", "Cancel anytime"]
//   },
//   {
//     id: "teacher_plan",
//     type: "Teacher",
//     price: 199900,
//     priceDisplay: "Rs.1999.00 per month",
//     credits: {
//       videos: 50,
//       images: 500,
//       text: "Unlimited",
//     },
//     features: ["Access to all AI tools", "Priority support", "Cancel anytime", "Team collaboration"]
//   },
// ];

// // Extend Window interface to include Razorpay
// declare global {
//   interface Window {
//     Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
//   }
// }

// export default function YourBillingComponent() {
//   const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
//   const [userRole, setUserRole] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [subscription, setSubscription] = useState<any>(null);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [razorpaySubscriptionId, setRazorpaySubscriptionId] = useState<string | null>(null);
//   const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
//   const [isCancelling, setIsCancelling] = useState(false);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         setIsLoading(true);
//         const supabase = createClient();
//         const {
//           data: { user },
//         } = await supabase.auth.getUser();

//         if (user) {
//           const role = user.user_metadata.role;
//           setUserRole(role);

//           // Fetch user's active subscription
//           const { data: subscriptionData, error: subscriptionError } = await supabase
//             .from("user_subscriptions")
//             .select(`
//               *,
//               plan:plan_id(
//                 type,
//                 price,
//                 price_display,
//                 credits,
//                 features
//               )
//             `)
//             .eq("user_id", user.id)
//             .order("created_at", { ascending: false })
//             .limit(1)
//             .single();

//           if (subscriptionData) {
//             setActiveSubscription(subscriptionData);
//           } else {
//             // Auto-select the plan matching the user's role if no subscription exists
//             const matchingPlan = subscriptionPlans.find(plan =>
//               plan.type.toLowerCase() === role?.toLowerCase()
//             );

//             if (matchingPlan) {
//               setSelectedPlan(matchingPlan);
//             }
//           }
//         }
//       } catch (err) {
//         console.error("Error fetching user:", err);
//         setError("Failed to load user data. Please refresh the page.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const filteredPlans = userRole && (userRole === "Student" || userRole === "Teacher")
//     ? subscriptionPlans.filter(plan => plan.type === userRole)
//     : subscriptionPlans;

//   const handlePaymentSuccess = async (response: RazorpayResponse) => {
//     try {
//       setIsProcessing(true);

//       // Instead of verifying via API, directly handle the success case
//       console.log("Payment successful:", response);

//       // Update local subscription state with available information
//       const subscriptionData = {
//         status: 'active',
//         plan_type: selectedPlan?.type,
//         start_date: new Date().toISOString(),
//         end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
//         payment_id: response.razorpay_payment_id,
//         order_id: response.razorpay_order_id,
//         subscription_id: razorpaySubscriptionId
//       };

//       // Store the payment success in Supabase for record-keeping
//       const supabase = createClient();
//       const { error: updateError } = await supabase
//         .from("user_subscriptions")
//         .update({
//           razorpay_payment_id: response.razorpay_payment_id,
//           razorpay_signature: response.razorpay_signature,
//           status: 'active',
//           meta_data: {
//             payment_response: response,
//             activated_at: new Date().toISOString()
//           }
//         })
//         .eq("razorpay_subscription_id", razorpaySubscriptionId as string);

//       if (updateError) {
//         console.error("Error updating subscription:", updateError);
//         // Continue anyway as webhook will eventually update the subscription
//       }

//       // Mark as successful regardless of database update
//       setIsSuccess(true);
//       setSubscription(subscriptionData);

//     } catch (error: any) {
//       console.error("Payment handling error:", error);
//       setError(error.message || "An error occurred processing your payment. The webhook will verify your payment shortly.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const createSubscription = async () => {
//     try {
//       const response = await fetch("/api/razorpay/create-subscription", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ planId: selectedPlan?.id }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to create subscription");
//       }

//       const data = await response.json();
//       return data.subscription;
//     } catch (error: any) {
//       console.error("Subscription creation error:", error);
//       throw error;
//     }
//   };

//   const makePayment = async () => {
//     if (!selectedPlan) {
//       alert("Please select a subscription plan");
//       return;
//     }

//     try {
//       setIsProcessing(true);
//       setError(null);

//       // Step 1: Create a subscription
//       const subscriptionData = await createSubscription();
//       if (!subscriptionData || !subscriptionData.id) {
//         throw new Error("Failed to create subscription");
//       }

//       // Store the subscription ID for later use
//       setRazorpaySubscriptionId(subscriptionData.id);

//       // Step 2: Create an order for the first payment
//       const response = await fetch("/api/razorpay", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           planId: selectedPlan.id,
//           subscriptionId: subscriptionData.id
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Network response was not ok");
//       }

//       const data = await response.json();
//       const options = {
//         name: "AI Ready School",
//         currency: data.currency,
//         order_id: data.id,
//         description: `${selectedPlan.type} Subscription - ${selectedPlan.priceDisplay}`,
//         subscription_id: subscriptionData.id,
//         handler: handlePaymentSuccess
//       };

//       const paymentObject = new window.Razorpay(options);
//       paymentObject.open();

//       paymentObject.on("payment.failed", function (errorResponse: RazorpayErrorResponse) {
//         setError("Payment failed. Please try again or contact support for help.");
//         setIsProcessing(false);
//       });
//     } catch (error: any) {
//       console.error("Error:", error);
//       setError(error.message || "Payment initialization failed. Please try again.");
//       setIsProcessing(false);
//     }
//   };

//   // Handle subscription cancellation
//   const handleCancelSubscription = async () => {
//     if (!activeSubscription || !activeSubscription.razorpay_subscription_id) {
//       setError("Cannot cancel subscription. Subscription ID missing.");
//       return;
//     }

//     try {
//       setIsCancelling(true);

//       // Call API to cancel subscription
//       const response = await fetch("/api/razorpay/cancel-subscription", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           subscriptionId: activeSubscription.razorpay_subscription_id
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to cancel subscription");
//       }

//       // Update local state
//       setActiveSubscription(prev =>
//         prev ? { ...prev, status: 'cancelled' } : null
//       );

//       // Show confirmation message
//       alert("Your subscription has been cancelled successfully.");

//       // Refresh the page to show updated subscription status
//       window.location.reload();

//     } catch (error: any) {
//       console.error("Error cancelling subscription:", error);
//       setError(error.message || "Failed to cancel subscription. Please try again later.");
//     } finally {
//       setIsCancelling(false);
//     }
//   };

//   // Helper function to get status display info
//   const getStatusInfo = (status: string) => {
//     switch(status.toLowerCase()) {
//       case 'active':
//         return { color: 'green', text: 'Active' };
//       case 'pending':
//         return { color: 'yellow', text: 'Pending' };
//       case 'halted':
//         return { color: 'orange', text: 'Halted' };
//       case 'cancelled':
//         return { color: 'red', text: 'Cancelled' };
//       case 'expired':
//         return { color: 'gray', text: 'Expired' };
//       case 'authenticated':
//         return { color: 'blue', text: 'Authenticated' };
//       case 'created':
//         return { color: 'purple', text: 'Created' };
//       case 'completed':
//         return { color: 'teal', text: 'Completed' };
//       default:
//         return { color: 'gray', text: status };
//     }
//   };

//   // Format date for display
//   const formatDate = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (e) {
//       return 'Invalid date';
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center p-8">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
//         <p className="text-lg">Loading subscription data...</p>
//       </div>
//     );
//   }

//   if (isSuccess && subscription) {
//     return (
//       <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center max-w-md mx-auto">
//         <div className="text-green-600 mb-4">
//           <Check className="h-16 w-16 mx-auto" />
//         </div>
//         <h2 className="text-2xl font-semibold text-green-800 mb-4">Payment Successful!</h2>
//         <p className="mb-6">Thank you for subscribing to the {selectedPlan?.type} plan.</p>
//         <div className="text-left bg-white p-4 rounded-md mb-6 text-sm">
//           <p><strong>Plan:</strong> {selectedPlan?.type}</p>
//           <p><strong>Amount:</strong> {selectedPlan?.priceDisplay}</p>
//           <p><strong>Valid until:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
//         </div>
//         <button
//           onClick={() => window.location.href = '/tools'}
//           className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
//         >
//           Explore AI Tools
//         </button>
//       </div>
//     );
//   }

//   // Display active subscription
//   if (activeSubscription) {
//     const startDate = activeSubscription.created_at;
//     // Calculate end date (assuming monthly billing)
//     const endDate = new Date(new Date(activeSubscription.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
//     const statusInfo = getStatusInfo(activeSubscription.status);
//     const isActive = activeSubscription.status === 'active';

//     return (
//       <div className="max-w-xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-semibold">Your Subscription</h2>
//           <div className={`px-3 py-1 rounded-full text-sm font-medium ${
//             statusInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
//             statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
//             statusInfo.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
//             statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
//             statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
//             statusInfo.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
//             statusInfo.color === 'teal' ? 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100' :
//             'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
//           }`}>
//             {statusInfo.text}
//           </div>
//         </div>

//         {/* Subscription explanation based on status */}
//         {activeSubscription.status !== 'active' && (
//           <div className={`mb-6 p-4 rounded-md ${
//             statusInfo.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
//             statusInfo.color === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
//             statusInfo.color === 'orange' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
//             statusInfo.color === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
//             statusInfo.color === 'purple' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
//             'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
//           }`}>
//             {activeSubscription.status === 'pending' && "Your subscription payment is being processed. This should be completed shortly."}
//             {activeSubscription.status === 'halted' && "Your subscription has been halted due to payment issues. Please update your payment method."}
//             {activeSubscription.status === 'cancelled' && "Your subscription has been cancelled. You can renew at any time."}
//             {activeSubscription.status === 'expired' && "Your subscription has expired. Please renew to continue accessing premium features."}
//             {activeSubscription.status === 'authenticated' && "Your subscription has been authenticated but not yet activated. The first payment will activate it."}
//             {activeSubscription.status === 'created' && "Your subscription has been created but not yet authenticated. Please complete the payment process."}
//             {activeSubscription.status === 'completed' && "Your subscription term has completed successfully."}
//           </div>
//         )}

//         <div className="space-y-6">
//           {/* Rest of the subscription display remains the same */}
//           <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
//             <h3 className="text-xl font-medium mb-4">{activeSubscription.plan?.type} Plan</h3>
//             <p className="text-2xl font-bold mb-2">{activeSubscription.plan?.price_display}</p>

//             <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-4">
//               <CalendarIcon className="h-4 w-4 mr-1" />
//               <span>Billing cycle: {formatDate(startDate)} - {formatDate(endDate)}</span>
//             </div>

//             {/* Credits section */}
//             <div className="mb-6">
//               <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
//                 Your Monthly Credits
//               </h4>
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="bg-white dark:bg-neutral-600 p-3 rounded-md shadow-sm text-center">
//                   <p className="text-lg font-bold">{activeSubscription.plan?.credits.videos}</p>
//                   <p className="text-xs">Videos</p>
//                 </div>
//                 <div className="bg-white dark:bg-neutral-600 p-3 rounded-md shadow-sm text-center">
//                   <p className="text-lg font-bold">{activeSubscription.plan?.credits.images}</p>
//                   <p className="text-xs">Images</p>
//                 </div>
//                 <div className="bg-white dark:bg-neutral-600 p-3 rounded-md shadow-sm text-center">
//                   <p className="text-lg font-bold">{activeSubscription.plan?.credits.text}</p>
//                   <p className="text-xs">Text</p>
//                 </div>
//               </div>
//             </div>

//             {/* Features section */}
//             <div className="mb-4">
//               <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
//                 Plan Features
//               </h4>
//               <ul className="space-y-2">
//                 {activeSubscription.plan?.features.map((feature, index) => (
//                   <li key={index} className="flex items-center">
//                     <Check className="h-4 w-4 text-green-500 mr-2" />
//                     <span className="text-sm">{feature}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>

//           {/* Error message */}
//           {error && (
//             <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
//               <AlertTriangle className="h-5 w-5" />
//               <p className="text-sm">{error}</p>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 pt-4">
//             <button
//               className="w-full py-2 px-4 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-700/30 dark:text-rose-400 dark:hover:bg-rose-700/40 rounded-md font-medium transition-colors duration-300"
//               onClick={() => window.location.href = '/tools'}
//             >
//               Access AI Tools
//             </button>

//             {isActive && (
//               <button
//                 className={`w-full py-2 px-4 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700/30 transition-colors duration-300 flex justify-center items-center gap-2 ${
//                   isCancelling ? 'opacity-75 cursor-not-allowed' : ''
//                 }`}
//                 onClick={handleCancelSubscription}
//                 disabled={isCancelling}
//               >
//                 {isCancelling ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     <span>Processing...</span>
//                   </>
//                 ) : (
//                   <>
//                     <span>Cancel Subscription</span>
//                   </>
//                 )}
//               </button>
//             )}

//             {!isActive && activeSubscription.status !== 'cancelled' && (
//               <button
//                 className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors duration-300 flex justify-center items-center gap-2"
//                 onClick={() => window.location.reload()}
//               >
//                 <RefreshCw className="h-4 w-4" />
//                 <span>Update Status</span>
//               </button>
//             )}

//             {activeSubscription.status === 'cancelled' && (
//               <button
//                 className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-300"
//                 onClick={() => window.location.href = '/payment'}
//               >
//                 Renew Subscription
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Script
//         id="razorpay-checkout-js"
//         src="https://checkout.razorpay.com/v1/checkout.js"
//       />

//       <div className="space-y-8">
//         <div className="max-w-2xl mx-auto text-center mb-8">
//           <h2 className="text-2xl font-semibold mb-2">Choose Your Subscription Plan</h2>
//           {userRole && (
//             <p className="text-neutral-600 dark:text-neutral-400">
//               Based on your {userRole} role, we've selected the most suitable plan for you.
//             </p>
//           )}
//         </div>

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
//             <p>{error}</p>
//           </div>
//         )}

//         <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
//           {filteredPlans.map((plan) => (
//             <div
//               key={plan.id}
//               className={`border-2 rounded-lg p-6 w-full md:w-[340px] cursor-pointer transition-all duration-300
//                 hover:translate-y-[-5px] hover:shadow-lg relative
//                 ${selectedPlan?.id === plan.id
//                   ? 'border-rose-500 bg-gradient-to-br from-white to-rose-50 dark:from-neutral-900 dark:to-rose-900/20'
//                   : 'border-neutral-200 dark:border-neutral-800'}`}
//               onClick={() => setSelectedPlan(plan)}
//             >
//               {selectedPlan?.id === plan.id && (
//                 <div className="absolute top-4 right-4 bg-rose-500 text-white p-1 rounded-full">
//                   <Check className="h-4 w-4" />
//                 </div>
//               )}

//               <h3 className="text-xl font-bold mb-2">{plan.type} Plan</h3>
//               <p className="text-2xl font-semibold mb-6">{plan.priceDisplay}</p>

//               <div className="mb-6">
//                 <p className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Free Credits Per Month:</p>
//                 <div className="space-y-1">
//                   <p className="flex items-center gap-2">
//                     <span className="w-24">Videos:</span>
//                     <span className="font-medium">{plan.credits.videos}</span>
//                   </p>
//                   <p className="flex items-center gap-2">
//                     <span className="w-24">Images:</span>
//                     <span className="font-medium">{plan.credits.images}</span>
//                   </p>
//                   <p className="flex items-center gap-2">
//                     <span className="w-24">Text:</span>
//                     <span className="font-medium">{plan.credits.text}</span>
//                   </p>
//                 </div>
//               </div>

//               <div>
//                 <p className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Features:</p>
//                 <ul className="space-y-1">
//                   {plan.features.map((feature, index) => (
//                     <li key={index} className="flex items-center gap-2">
//                       <Check className="h-4 w-4 text-green-500" />
//                       <span>{feature}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           ))}
//         </div>

//         <button
//           className={`block w-full max-w-[320px] mx-auto py-4 px-6 rounded-md font-semibold text-white transition-all duration-300
//             ${isProcessing ? 'bg-blue-400 cursor-wait' :
//               selectedPlan ? 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg' : 'bg-neutral-400 cursor-not-allowed'}`}
//           onClick={makePayment}
//           disabled={!selectedPlan || isProcessing}
//         >
//           {isProcessing ? (
//             <span className="flex items-center justify-center gap-2">
//               <Loader2 className="h-4 w-4 animate-spin" />
//               Processing...
//             </span>
//           ) : selectedPlan ? (
//             `Subscribe to ${selectedPlan.type} Plan`
//           ) : (
//             'Select a Plan'
//           )}
//         </button>
//       </div>
//     </>
//   );
// }
