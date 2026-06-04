import { useState, useEffect, useCallback } from "react";
import { ServiceItem, InventoryItem, Employee, Pet, Client, Appointment } from "../types";

async function fetchJson(url: string) {
  const token = localStorage.getItem("pet_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    localStorage.removeItem("pet_token");
    window.location.hash = "#/";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem("pet_token", token);
  else localStorage.removeItem("pet_token");
}

export function getAuthToken(): string | null {
  return localStorage.getItem("pet_token");
}

export function useApiServices(initial: ServiceItem[]) {
  const [data, setData] = useState<ServiceItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/services");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_ };
}

export function useApiInventory(initial: InventoryItem[]) {
  const [data, setData] = useState<InventoryItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/inventory");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_ };
}

export function useApiEmployees(initial: Employee[]) {
  const [data, setData] = useState<Employee[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/employees");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_ };
}

export function useApiPets(initial: Pet[]) {
  const [data, setData] = useState<Pet[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/pets");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_ };
}

export function useApiClients(initial: Client[]) {
  const [data, setData] = useState<Client[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/clients");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_ };
}

export function useApiAppointments(initial: Appointment[]) {
  const [data, setData] = useState<Appointment[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await fetchJson("/api/appointments");
      if (json.status === "success") setData(json.data);
    } catch (e: any) { setError(e.message); console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refresh: fetch_, setData };
}
