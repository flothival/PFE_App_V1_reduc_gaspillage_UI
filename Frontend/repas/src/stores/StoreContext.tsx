import { createContext, useContext } from "react";
import { appStore } from "./AppStore";
import { authStore } from "@/features/auth/store/AuthStore";

const stores = { appStore, authStore };

const StoreContext = createContext(stores);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>
);

export const useStores = () => useContext(StoreContext);
