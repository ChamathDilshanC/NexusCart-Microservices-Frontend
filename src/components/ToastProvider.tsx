"use client";

import { GoeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

export function ToastProvider() {
  return <GoeyToaster position="bottom-right" />;
}
