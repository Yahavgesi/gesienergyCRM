import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ViewQuote() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: () => base44.entities.Quote.get(id),
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-[#0a1a1f] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-400 text-lg">לא נמצא מזהה הצעת מחיר</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#142e38] border-t-[#2dd4a8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#0a1a1f] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-400 text-lg">הצעת המחיר לא נמצאה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1a1f] p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-[#0f2229] border border-[rgba(45,212,168,0.1)] p-8">
          <h1 className="text-3xl font-bold text-white mb-2">{quote.customer_name}</h1>
          <p className="text-gray-400 mb-6">הצעת מחיר #{quote.version || 1}</p>

          {quote.items && quote.items.length > 0 && (
            <div className="space-y-3 mb-6">
              {quote.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-[#142e38] rounded-xl">
                  <span className="text-white">{item.description}</span>
                  <div className="text-left">
                    <span className="text-gray-400 text-sm">{item.quantity} × ₪{item.unit_price?.toLocaleString()}</span>
                    <span className="text-[#2dd4a8] font-bold mr-4">₪{item.total?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[rgba(45,212,168,0.1)] pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-300">סה"כ</span>
            <span className="text-2xl font-bold text-[#2dd4a8]">₪{quote.total_amount?.toLocaleString()}</span>
          </div>

          {quote.notes && (
            <div className="mt-6 p-4 bg-[#142e38] rounded-xl">
              <p className="text-gray-400 text-sm">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}