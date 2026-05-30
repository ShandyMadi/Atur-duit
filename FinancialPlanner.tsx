
export function translateFirebaseError(err: any): string {
  const code = err.code || '';
  const msg = err.message || '';

  if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
    return 'Email sudah terdaftar. Gunakan email lain.';
  }
  if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
    return 'Format email tidak valid.';
  }
  if (code === 'auth/weak-password' || msg.includes('weak-password')) {
    return 'Password terlalu lemah (min. 6 karakter).';
  }
  if (code === 'auth/user-not-found' || msg.includes('user-not-found') || code === 'auth/wrong-password' || msg.includes('wrong-password')) {
    return 'Email atau password salah.';
  }
  if (code === 'auth/invalid-credential') {
    return 'Kredensial tidak valid. Silakan periksa kembali email dan password Anda.';
  }
  if (code === 'unavailable' || msg.includes('unavailable')) {
    return 'Layanan sedang tidak tersedia. Periksa koneksi internet Anda.';
  }
  if (code === 'permission-denied' || msg.includes('insufficient permissions')) {
    return 'Gagal mengambil data: Izin ditolak. Silakan hubungi admin.';
  }

  return msg || 'Terjadi kesalahan sistem. Silakan coba lagi.';
}
