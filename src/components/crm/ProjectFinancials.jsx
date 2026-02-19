import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FormModal from "./FormModal";
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  CheckCircle2, Clock, Package, Wrench, FileText, 
  Truck, Users, AlertCircle, Edit, Trash2, Zap
} from "lucide-react";

const categoryIcons = {
  panels: Package,
  inverters: Zap,
  installation: Wrench,
  permits: FileText,
  transportation: Truck,
  labor: Users,
  other: AlertCircle,
};

const categoryLabels = {
  panels: 'פאנלים',
  inverters: 'מהפכים',
  installation: 'התקנה',
  permits: 'היתרים',
  transportation: 'הובלה',
  labor: 'עבודה',
  other: 'אחר',
};

export default function ProjectFinancials({ project }) {
  const queryClient = useQueryClient();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({});
  const [editingExpense, setEditingExpense] = useState(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneData, setMilestoneData] = useState({});
  const [editingMilestone, setEditingMilestone] = useState(null);

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', project.id],
    queryFn: () => base44.entities.Payment.filter({ project_id: project.id }),
    initialData: [],
  });

  const { data: paymentMilestones = [] } = useQuery({
    queryKey: ['payment-milestones', project.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ project_id: project.id }, '-created_date'),
    initialData: [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', project.id],
    queryFn: () => base44.entities.ProjectExpense.filter({ project_id: project.id }),
    initialData: [],
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => 
      editingExpense 
        ? base44.entities.ProjectExpense.update(editingExpense.id, data)
        : base44.entities.ProjectExpense.create({ ...data, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', project.id]);
      setExpenseOpen(false);
      setExpenseData({});
      setEditingExpense(null);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', project.id]);
    },
  });

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, is_paid }) => 
      base44.entities.ProjectExpense.update(id, { 
        is_paid, 
        paid_date: is_paid ? new Date().toISOString().split('T')[0] : null 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', project.id]);
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data) => 
      editingMilestone 
        ? base44.entities.PaymentRequest.update(editingMilestone.id, data)
        : base44.entities.PaymentRequest.create({ 
            ...data, 
            project_id: project.id,
            customer_email: project.customer_email,
            contact_id: project.customer_id,
            status: 'pending'
          }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-milestones', project.id]);
      setMilestoneOpen(false);
      setMilestoneData({});
      setEditingMilestone(null);
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-milestones', project.id]);
    },
  });

  // Calculations
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidExpenses = expenses.filter(e => e.is_paid).reduce((sum, e) => sum + (e.amount || 0), 0);
  const unpaidExpenses = totalExpenses - paidExpenses;
  
  const grossProfit = totalRevenue - totalExpenses;
  const profitPerKwp = project.kwp > 0 ? grossProfit / project.kwp : 0;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const expenseFields = [
    { key: 'category', label: 'קטגוריה', type: 'select', options: [
      { value: 'panels', label: 'פאנלים' },
      { value: 'inverters', label: 'מהפכים' },
      { value: 'installation', label: 'התקנה' },
      { value: 'permits', label: 'היתרים' },
      { value: 'transportation', label: 'הובלה' },
      { value: 'labor', label: 'עבודה' },
      { value: 'other', label: 'אחר' },
    ]},
    { key: 'description', label: 'תיאור', placeholder: 'תיאור ההוצאה' },
    { key: 'amount', label: 'סכום', type: 'number', placeholder: '0' },
    { key: 'supplier', label: 'ספק', placeholder: 'שם הספק' },
    { key: 'invoice_number', label: 'מספר חשבונית', placeholder: 'מס\' חשבונית' },
    { key: 'notes', label: 'הערות', type: 'textarea', placeholder: 'הערות נוספות' },
  ];

  const milestoneFields = [
    { key: 'type', label: 'סוג תשלום', type: 'select', options: [
      { value: 'deposit', label: 'מקדמה' },
      { value: 'milestone', label: 'אבן דרך' },
      { value: 'installment', label: 'תשלום' },
      { value: 'final_payment', label: 'תשלום סופי' },
    ]},
    { key: 'amount', label: 'סכום', type: 'number', placeholder: '0' },
    { key: 'description', label: 'תיאור', placeholder: 'תיאור התשלום' },
    { key: 'installments', label: 'מספר תשלומים', type: 'number', placeholder: '1' },
  ];

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2dd4a8]/10 to-[#2dd4a8]/5 border border-[#2dd4a8]/20 p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">הכנסות</p>
              <p className="text-3xl font-bold text-[#2dd4a8]">₪{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#2dd4a8]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#2dd4a8]" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500">תשלומים שהתקבלו</p>
        </motion.div>

        {/* Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">הוצאות</p>
              <p className="text-3xl font-bold text-red-400">₪{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-green-400">₪{paidExpenses.toLocaleString()} בוצע</span>
            <span className="text-gray-600">•</span>
            <span className="text-amber-400">₪{unpaidExpenses.toLocaleString()} ממתין</span>
          </div>
        </motion.div>

        {/* Profit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            grossProfit >= 0 
              ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20' 
              : 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">רווח גולמי</p>
              <p className={`text-3xl font-bold ${grossProfit >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                ₪{grossProfit.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              grossProfit >= 0 ? 'bg-blue-500/20' : 'bg-amber-500/20'
            }`}>
              <DollarSign className={`w-6 h-6 ${grossProfit >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-400">₪{profitPerKwp.toLocaleString()} לkWp</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">{profitMargin.toFixed(1)}% מרווח</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Milestones */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              אבני דרך לתשלום
            </h3>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingMilestone(null);
                setMilestoneData({});
                setMilestoneOpen(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוספה
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {paymentMilestones.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">אין אבני דרך מוגדרות</p>
            ) : (
              paymentMilestones.map(milestone => (
                <div key={milestone.id} className={`p-3 rounded-xl border transition-all ${
                  milestone.status === 'paid' 
                    ? 'bg-[#0a1a1f] border-[rgba(45,212,168,0.08)]' 
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${milestone.status === 'paid' ? 'text-[#2dd4a8]' : 'text-blue-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${milestone.status === 'paid' ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {milestone.description || 'תשלום'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {milestone.type === 'deposit' ? 'מקדמה' :
                           milestone.type === 'milestone' ? 'אבן דרך' :
                           milestone.type === 'installment' ? 'תשלום' :
                           milestone.type === 'final_payment' ? 'תשלום סופי' : milestone.type}
                          {milestone.installments > 1 && ` • ${milestone.installments} תשלומים`}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${milestone.status === 'paid' ? 'text-gray-500' : 'text-blue-400'}`}>
                      ₪{milestone.amount.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setMilestoneData(milestone);
                        setMilestoneOpen(true);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      ערוך
                    </button>
                    <button
                      onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      מחק
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Payments */}
          {payments.filter(p => p.status === 'completed').length > 0 && (
            <div className="mt-6 pt-4 border-t border-[rgba(45,212,168,0.1)]">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">תשלומים שהתקבלו</h4>
              <div className="space-y-2">
                {payments.filter(p => p.status === 'completed').map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0a1a1f]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-[#2dd4a8]" />
                      <p className="text-xs text-gray-300">{payment.description || 'תשלום'}</p>
                    </div>
                    <p className="text-xs font-bold text-[#2dd4a8]">₪{payment.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses Panel */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              הוצאות פרויקט
            </h3>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingExpense(null);
                setExpenseData({});
                setExpenseOpen(true);
              }}
              className="bg-gradient-to-r from-[#2dd4a8] to-[#1fa882]"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוספה
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">אין הוצאות רשומות</p>
            ) : (
              expenses.map(expense => {
                const Icon = categoryIcons[expense.category] || AlertCircle;
                return (
                  <div 
                    key={expense.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      expense.is_paid 
                        ? 'bg-[#0a1a1f] border-[rgba(45,212,168,0.08)]' 
                        : 'bg-amber-500/5 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => togglePaidMutation.mutate({ id: expense.id, is_paid: !expense.is_paid })}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          expense.is_paid 
                            ? 'bg-[#2dd4a8] border-[#2dd4a8]' 
                            : 'border-gray-600 hover:border-[#2dd4a8]'
                        }`}
                      >
                        {expense.is_paid && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className={`text-sm font-medium ${expense.is_paid ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {expense.description}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {categoryLabels[expense.category]} {expense.supplier && `• ${expense.supplier}`}
                              </p>
                            </div>
                          </div>
                          <p className={`text-sm font-bold flex-shrink-0 ${expense.is_paid ? 'text-gray-500' : 'text-red-400'}`}>
                            ₪{expense.amount.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setExpenseData(expense);
                              setExpenseOpen(true);
                            }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            ערוך
                          </button>
                          <button
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            מחק
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <FormModal
        open={expenseOpen}
        onClose={() => {
          setExpenseOpen(false);
          setExpenseData({});
          setEditingExpense(null);
        }}
        title={editingExpense ? 'עריכת הוצאה' : 'הוצאה חדשה'}
        fields={expenseFields}
        data={expenseData}
        setData={setExpenseData}
        onSubmit={() => createExpenseMutation.mutate(expenseData)}
        submitting={createExpenseMutation.isPending}
      />

      <FormModal
        open={milestoneOpen}
        onClose={() => {
          setMilestoneOpen(false);
          setMilestoneData({});
          setEditingMilestone(null);
        }}
        title={editingMilestone ? 'עריכת אבן דרך' : 'אבן דרך חדשה'}
        fields={milestoneFields}
        data={milestoneData}
        setData={setMilestoneData}
        onSubmit={() => createMilestoneMutation.mutate(milestoneData)}
        submitting={createMilestoneMutation.isPending}
      />
    </div>
  );
}