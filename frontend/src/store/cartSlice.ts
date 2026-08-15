import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscountValue: number; // Flat or Percentage deduction multiplier
  couponDiscountType: 'PERCENTAGE' | 'FIXED' | null;
  selectedTable: string;
  orderType: 'DELIVERY' | 'DINE_IN' | 'TAKEAWAY';
}

const initialState: CartState = {
  items: [],
  couponCode: null,
  couponDiscountValue: 0,
  couponDiscountType: null,
  selectedTable: 'Table 1',
  orderType: 'DINE_IN',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing && action.payload.quantity > 0) {
        existing.quantity = action.payload.quantity;
      }
    },
    setSelectedTable: (state, action: PayloadAction<string>) => {
      state.selectedTable = action.payload;
      if (action.payload.startsWith('Table')) {
        state.orderType = 'DINE_IN';
      } else if (action.payload === 'Takeaway') {
        state.orderType = 'TAKEAWAY';
      } else if (action.payload === 'Delivery') {
        state.orderType = 'DELIVERY';
      }
    },
    setOrderType: (state, action: PayloadAction<'DELIVERY' | 'DINE_IN' | 'TAKEAWAY'>) => {
      state.orderType = action.payload;
    },
    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; value: number; type: 'PERCENTAGE' | 'FIXED' }>
    ) => {
      state.couponCode = action.payload.code;
      state.couponDiscountValue = action.payload.value;
      state.couponDiscountType = action.payload.type;
    },
    removeCoupon: (state) => {
      state.couponCode = null;
      state.couponDiscountValue = 0;
      state.couponDiscountType = null;
    },
    clearCart: (state) => {
      state.items = [];
      state.couponCode = null;
      state.couponDiscountValue = 0;
      state.couponDiscountType = null;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  setSelectedTable,
  setOrderType,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
