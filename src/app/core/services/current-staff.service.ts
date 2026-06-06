import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({ providedIn: 'root' })
export class CurrentStaffService {
  constructor(private afAuth: AngularFireAuth) {}

  async getStaffId(): Promise<string> {
    const user = await this.afAuth.currentUser;
    return user?.uid || user?.email || 'staff';
  }

  async getStaffLabel(): Promise<string> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      return 'Staff';
    }
    return user.displayName || user.email || user.uid || 'Staff';
  }
}
