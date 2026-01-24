import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

function normalizeMobbyName(name) {
  return String(name || "").replace(/モビィ/g, "モビー").trim();
}

function extractFirstMobbyFromState(state) {
  const objects = Array.isArray(state?.objects) ? state.objects : [];
  for (const o of objects) {
    if (o?.type !== "img") continue;
    const rawName = typeof o.name === "string" ? o.name : "";
    if (!/モビ[ィー]/.test(rawName)) continue;
    const name = normalizeMobbyName(rawName);
    const url = o.src || o.url || "";
    if (name) return { name, url };
  }
  return null;
}

function extractMobbyUrlFromState(state, targetName) {
  if (!targetName) return "";
  const target = normalizeMobbyName(targetName);
  const objects = Array.isArray(state?.objects) ? state.objects : [];
  for (const o of objects) {
    if (o?.type !== "img") continue;
    const rawName = typeof o.name === "string" ? o.name : "";
    if (!/モビ[ィー]/.test(rawName)) continue;
    const name = normalizeMobbyName(rawName);
    if (name !== target) continue;
    return o.src || o.url || "";
  }
  return "";
}

async function waitForAuth() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Auth timeout"));
    }, 10000);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (!user) {
        reject(new Error("Login required"));
        return;
      }
      resolve(user);
    });
  });
}

export async function runBackfill({ batchSize = 50, dryRun = false } = {}) {
  const user = await waitForAuth();
  console.log("[backfill] start", { uid: user.uid, batchSize, dryRun });

  const designsCol = collection(db, "designs");
  const profileCache = new Map();
  const totals = { scanned: 0, updated: 0, skipped: 0, errors: 0 };
  let lastDoc = null;

  async function fetchProfile(uid) {
    if (!uid) return null;
    if (profileCache.has(uid)) return profileCache.get(uid);
    try {
      const ref = doc(db, "profiles", uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : null;
      profileCache.set(uid, data);
      return data;
    } catch (e) {
      console.warn("[backfill] profile fetch failed", uid, e);
      profileCache.set(uid, null);
      return null;
    }
  }

  while (true) {
    const q = lastDoc
      ? query(designsCol, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(batchSize))
      : query(designsCol, orderBy("createdAt", "desc"), limit(batchSize));
    const snap = await getDocs(q);
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      totals.scanned += 1;
      const data = docSnap.data() || {};
      const next = {};
      let needsUpdate = false;

      const profile = await fetchProfile(data.uid);
      const profileMobby = normalizeMobbyName(profile?.mobbyType || "");
      const profileUrl = profile?.mobbyTypeUrl || "";

      let mobbyType = normalizeMobbyName(data.mobbyType || "");
      let mobbyTypeUrl = data.mobbyTypeUrl || "";

      if (!mobbyType) {
        if (profileMobby) {
          mobbyType = profileMobby;
          next.mobbyType = profileMobby;
          needsUpdate = true;
        } else {
          const fromState = extractFirstMobbyFromState(data.state);
          if (fromState?.name) {
            mobbyType = fromState.name;
            next.mobbyType = fromState.name;
            needsUpdate = true;
          }
        }
      }

      if (!mobbyTypeUrl) {
        if (profileUrl) {
          mobbyTypeUrl = profileUrl;
          next.mobbyTypeUrl = profileUrl;
          needsUpdate = true;
        } else if (mobbyType) {
          const fromStateUrl = extractMobbyUrlFromState(data.state, mobbyType);
          if (fromStateUrl) {
            next.mobbyTypeUrl = fromStateUrl;
            needsUpdate = true;
          }
        }
      }

      if (!needsUpdate) {
        totals.skipped += 1;
        continue;
      }

      if (dryRun) {
        totals.updated += 1;
        console.log("[backfill] dry-run update", docSnap.id, next);
        continue;
      }

      try {
        await updateDoc(docSnap.ref, { ...next, updatedAt: serverTimestamp() });
        totals.updated += 1;
        console.log("[backfill] updated", docSnap.id, next);
      } catch (e) {
        totals.errors += 1;
        console.warn("[backfill] update failed", docSnap.id, e);
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }

  console.log("[backfill] done", totals);
  return totals;
}

