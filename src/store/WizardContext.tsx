import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { WizardState, WizardDocument, Session, Insured } from "../types";
import { clearSession as clearSessionStorage, loadSession, saveSession } from "../utils/sessionStorage";

type Action =
  | { type: "SET_SESSION"; payload: Session }
  | { type: "CLEAR_SESSION" }
  | { type: "SET_INSURED"; payload: Insured | null }
  | { type: "SET_CLAIM_TYPE"; payload: WizardState["claimType"] }
  | { type: "ADD_DOCUMENTS"; payload: WizardDocument[] }
  | { type: "UPDATE_DOCUMENT"; payload: { id: string; patch: Partial<WizardDocument> } }
  | { type: "REMOVE_DOCUMENT"; payload: { id: string } }
  | { type: "SET_PRE_REG"; payload: string | null }
  | { type: "RESET" };

const initialState: WizardState = {
  session: null,
  selectedInsured: null,
  claimType: null,
  documents: [],
  preRegistrationNumber: null
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, session: action.payload };
    case "CLEAR_SESSION":
      return { ...initialState };
    case "SET_INSURED":
      return { ...state, selectedInsured: action.payload };
    case "SET_CLAIM_TYPE":
      return { ...state, claimType: action.payload };
    case "ADD_DOCUMENTS":
      return { ...state, documents: [...state.documents, ...action.payload] };
    case "UPDATE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.patch } : d
        )
      };
    case "REMOVE_DOCUMENT":
      return { ...state, documents: state.documents.filter((d) => d.id !== action.payload.id) };
    case "SET_PRE_REG":
      return { ...state, preRegistrationNumber: action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      dispatch({ type: "SET_SESSION", payload: stored });
    }
  }, []);

  useEffect(() => {
    if (state.session) {
      saveSession(state.session);
    }
  }, [state.session]);

  const value: WizardContextValue = {
    state,
    dispatch
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard debe usarse dentro de WizardProvider");
  return ctx;
}

export function useSession() {
  const {
    state: { session },
    dispatch
  } = useWizard();
  const clear = () => {
    clearSessionStorage();
    dispatch({ type: "RESET" });
  };
  return { session, clear };
}

