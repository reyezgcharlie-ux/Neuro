// src/hooks/useFirebase.js
// Todos los hooks para interactuar con Firebase

import { useState, useEffect, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy,
  where, increment, serverTimestamp,
} from "firebase/firestore";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "../firebase";

// ─── AUTH ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Carga el perfil extendido desde Firestore
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...snap.data() });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (email, password, artistName, avatarFile) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: artistName });

    let avatarUrl = null;
    if (avatarFile) {
      avatarUrl = await uploadFile(avatarFile, `avatars/${cred.user.uid}`);
    }

    // Guarda perfil en Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      name:        artistName,
      email,
      avatarUrl,
      followers:   0,
      following:   0,
      tracksCount: 0,
      createdAt:   serverTimestamp(),
    });
    return cred.user;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return { user, loading, register, login, logout };
}

// ─── TRACKS ──────────────────────────────────────────────────────────────────

export function useTracks() {
  const [tracks, setTracks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha en tiempo real
    const q = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTracks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { tracks, loading };
}

export function useUploadTrack() {
  const [progress, setProgress] = useState(0);   // 0-100
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const upload = useCallback(async ({ audioFile, coverFile, title, genre, aiModel, tags, userId, artistName }) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Sube el audio con seguimiento de progreso
      const audioUrl = await uploadFileWithProgress(
        audioFile,
        `audio/${userId}/${Date.now()}_${audioFile.name}`,
        (p) => setProgress(p * 0.7)   // audio = 70% del progreso total
      );

      // 2. Sube la portada (si existe)
      let coverUrl = null;
      if (coverFile) {
        coverUrl = await uploadFileWithProgress(
          coverFile,
          `covers/${userId}/${Date.now()}_${coverFile.name}`,
          (p) => setProgress(70 + p * 0.25)  // cover = 25% del progreso
        );
      }

      setProgress(95);

      // 3. Guarda metadata en Firestore
      const trackRef = await addDoc(collection(db, "tracks"), {
        title,
        genre,
        aiModel:    aiModel || "Otro",
        tags:       tags || [],
        audioUrl,
        coverUrl,
        artistId:   userId,
        artistName,
        plays:      0,
        likes:      0,
        duration:   0,   // se puede calcular en el cliente y pasarlo
        waveform:   Array.from({ length: 30 }, () => Math.random() * 0.8 + 0.2),
        createdAt:  serverTimestamp(),
      });

      // 4. Incrementa el contador de tracks del usuario
      await updateDoc(doc(db, "users", userId), { tracksCount: increment(1) });

      setProgress(100);
      setUploading(false);
      return trackRef.id;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  }, []);

  return { upload, progress, uploading, error };
}

// ─── LIKES ───────────────────────────────────────────────────────────────────

export function useLikes(userId) {
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "likes"), where("userId", "==", userId));
    const unsub = onSnapshot(q, snap => {
      setLikedIds(new Set(snap.docs.map(d => d.data().trackId)));
    });
    return unsub;
  }, [userId]);

  const toggleLike = async (trackId) => {
    if (!userId) return;
    const likeId  = `${userId}_${trackId}`;
    const likeRef = doc(db, "likes", likeId);
    const snap    = await getDoc(likeRef);

    if (snap.exists()) {
      // Quitar like
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "tracks", trackId), { likes: increment(-1) });
    } else {
      // Dar like
      await setDoc(likeRef, { userId, trackId, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "tracks", trackId), { likes: increment(1) });
    }
  };

  return { likedIds, toggleLike };
}

// ─── FOLLOWS ─────────────────────────────────────────────────────────────────

export function useFollows(userId) {
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "follows"), where("followerId", "==", userId));
    const unsub = onSnapshot(q, snap => {
      setFollowingIds(new Set(snap.docs.map(d => d.data().followingId)));
    });
    return unsub;
  }, [userId]);

  const toggleFollow = async (targetUserId) => {
    if (!userId || userId === targetUserId) return;
    const followId  = `${userId}_${targetUserId}`;
    const followRef = doc(db, "follows", followId);
    const snap      = await getDoc(followRef);

    if (snap.exists()) {
      await deleteDoc(followRef);
      await updateDoc(doc(db, "users", targetUserId), { followers:  increment(-1) });
      await updateDoc(doc(db, "users", userId),       { following:  increment(-1) });
    } else {
      await setDoc(followRef, {
        followerId:  userId,
        followingId: targetUserId,
        createdAt:   serverTimestamp(),
      });
      await updateDoc(doc(db, "users", targetUserId), { followers:  increment(1) });
      await updateDoc(doc(db, "users", userId),       { following:  increment(1) });
    }
  };

  return { followingIds, toggleFollow };
}

// ─── PLAYS ───────────────────────────────────────────────────────────────────

export async function registerPlay(trackId) {
  await updateDoc(doc(db, "tracks", trackId), { plays: increment(1) });
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function useArtists() {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("followers", "desc"));
    const unsub = onSnapshot(q, snap => {
      setArtists(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return { artists };
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

async function uploadFile(file, path) {
  const fileRef = ref(storage, path);
  await uploadBytesResumable(fileRef, file);
  return getDownloadURL(fileRef);
}

function uploadFileWithProgress(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const fileRef  = ref(storage, path);
    const task     = uploadBytesResumable(fileRef, file);
    task.on(
      "state_changed",
      snap => onProgress(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
