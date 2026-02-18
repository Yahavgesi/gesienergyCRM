import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import { ShoppingBag, Battery, Car, Shield, Monitor, Zap, Gift, ShoppingCart } from "lucide-react";

const categoryIcons = {
  battery: Battery,
  ev_charger: Car,
  warranty: Shield,
  monitoring: Monitor,
  panel_upgrade: Zap,
  other: ShoppingBag,
};

export default function CustomerStore() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true }),
    initialData: [],
  });

  const { data: benefits, isLoading: loadingBenefits } = useQuery({
    queryKey: ['monthly-benefits'],
    queryFn: () => base44.entities.MonthlyBenefit.filter({ active: true }),
    initialData: [],
  });

  const orderMutation = useMutation({
    mutationFn: (product) => base44.entities.Order.create({
      customer_email: user.email,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      total_amount: product.price,
      status: "pending",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      alert('ההזמנה נקלטה בהצלחה!');
    },
  });

  if (loadingProducts) {
    return <div className="p-4 space-y-3" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-lg font-bold text-white mb-4">חנות</h1>

      {/* Monthly Benefits Banner */}
      {benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl overflow-hidden border border-[#2dd4a8]/20"
          style={{ background: 'linear-gradient(135deg, rgba(45,212,168,0.1) 0%, rgba(15,34,41,0.9) 100%)' }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-[#2dd4a8]" />
              <span className="text-xs font-semibold text-[#2dd4a8]">הטבת החודש</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">{benefits[0].title}</h3>
            <p className="text-xs text-gray-400">{benefits[0].description}</p>
          </div>
        </motion.div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="החנות ריקה" description="מוצרים חדשים יתווספו בקרוב" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, i) => {
            const CatIcon = categoryIcons[product.category] || ShoppingBag;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="gesi-card p-4 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-[#142e38] flex items-center justify-center mb-3 border border-[rgba(45,212,168,0.1)]">
                  <CatIcon className="w-6 h-6 text-[#2dd4a8]" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{product.name}</h3>
                <p className="text-[10px] text-gray-400 mb-3 flex-1 line-clamp-2">{product.description}</p>
                <p className="text-lg font-bold text-[#2dd4a8] mb-3">₪{(product.price || 0).toLocaleString()}</p>
                <button
                  onClick={() => orderMutation.mutate(product)}
                  disabled={orderMutation.isPending}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)', color: 'white' }}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  הוסף להזמנה
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}