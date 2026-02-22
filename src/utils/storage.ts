import { Freelancer } from "@/types";

const STORAGE_KEY = "skillfind_freelancers";

export function getFreelancers(): Freelancer[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveFreelancer(freelancer: Freelancer): void {
    const existing = getFreelancers();
    existing.push(freelancer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
