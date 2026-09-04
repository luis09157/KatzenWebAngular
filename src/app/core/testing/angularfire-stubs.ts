/**
 * Stubs para unit tests (Karma/Jasmine) de componentes admin que dependen de
 * AngularFire compat, Router y MatDialog. NUNCA conectan a Firebase real: toda
 * lectura devuelve vacío (`of([])` / `of(null)`) y toda escritura resuelve sin efecto.
 *
 * Uso típico en un spec `should create`:
 *
 *   await TestBed.configureTestingModule({
 *     declarations: [MiComponent, ...ADMIN_TEST_DECLARATIONS],
 *     imports: [...ADMIN_TEST_IMPORTS],
 *     providers: [...provideAdminTestStubs()],
 *     schemas: [NO_ERRORS_SCHEMA]
 *   }).compileComponents();
 */
import { Provider } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { EMPTY, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AuthProfileService } from '../services/auth-profile.service';
import { CurrentStaffService } from '../services/current-staff.service';
import { FirebaseFunctionsService } from '../services/firebase-functions.service';
import { AdminEstadoClassPipe } from '../../shared/pipes/admin-estado-class.pipe';
import { AdminPrioridadClassPipe } from '../../shared/pipes/admin-prioridad-class.pipe';

export const STUB_PUSH_KEY = 'stub-push-key';

/** DataSnapshot vacío (compat). */
export function createSnapshotStub(value: unknown = null, key: string | null = null) {
  return {
    key,
    val: () => value,
    exists: () => value !== null && value !== undefined,
    exportVal: () => value,
    forEach: () => false,
    hasChild: () => false,
    hasChildren: () => false,
    numChildren: () => 0,
    toJSON: () => value,
    child: () => createSnapshotStub(null, null)
  };
}

/** `firebase.database.Reference` encadenable: toda query devuelve el mismo stub. */
export function createDatabaseRefStub(key: string | null = null): any {
  const ref: any = {
    key,
    once: async () => createSnapshotStub(null, key),
    get: async () => createSnapshotStub(null, key),
    on: () => undefined,
    off: () => undefined,
    set: async () => undefined,
    update: async () => undefined,
    remove: async () => undefined,
    transaction: async () => ({ committed: true, snapshot: createSnapshotStub() }),
    push: () => {
      const child = createDatabaseRefStub(STUB_PUSH_KEY);
      const thenable: any = Promise.resolve(child);
      thenable.key = STUB_PUSH_KEY;
      thenable.ref = child;
      return thenable;
    },
    child: () => createDatabaseRefStub(null)
  };
  ['orderByChild', 'orderByKey', 'orderByValue', 'equalTo', 'startAt', 'startAfter', 'endAt', 'endBefore', 'limitToFirst', 'limitToLast'].forEach(
    (m) => (ref[m] = () => ref)
  );
  return ref;
}

/** `AngularFireList` vacío. */
export function createAngularFireListStub(): any {
  const query = createDatabaseRefStub();
  return {
    query,
    valueChanges: () => of([]),
    snapshotChanges: () => of([]),
    stateChanges: () => EMPTY,
    auditTrail: () => EMPTY,
    push: () => query.push(),
    set: async () => undefined,
    update: async () => undefined,
    remove: async () => undefined
  };
}

/** `AngularFireObject` vacío. */
export function createAngularFireObjectStub(): any {
  return {
    query: createDatabaseRefStub(),
    valueChanges: () => of(null),
    snapshotChanges: () => of({ key: null, payload: createSnapshotStub(), type: 'value' }),
    set: async () => undefined,
    update: async () => undefined,
    remove: async () => undefined
  };
}

export function createAngularFireDatabaseStub(): any {
  return {
    list: () => createAngularFireListStub(),
    object: () => createAngularFireObjectStub(),
    createPushId: () => STUB_PUSH_KEY,
    database: {
      ref: () => createDatabaseRefStub(),
      goOnline: () => undefined,
      goOffline: () => undefined
    }
  };
}

export function createAngularFireAuthStub(): any {
  return {
    authState: of(null),
    user: of(null),
    idToken: of(null),
    idTokenResult: of(null),
    credential: of(null),
    currentUser: Promise.resolve(null),
    signOut: async () => undefined,
    setPersistence: async () => undefined,
    signInWithEmailAndPassword: async () => {
      throw new Error('AngularFireAuth stub: sin sesión en tests');
    }
  };
}

export function createAngularFireFunctionsStub(): any {
  return {
    httpsCallable: () => () => of(null)
  };
}

export function createAngularFireStorageStub(): any {
  const ref = {
    put: () => ({ snapshotChanges: () => EMPTY, percentageChanges: () => EMPTY, then: (fn: any) => Promise.resolve(fn(undefined)) }),
    getDownloadURL: () => of(''),
    delete: () => of(undefined)
  };
  return {
    ref: () => ref,
    upload: () => ref.put()
  };
}

export function createActivatedRouteStub(params: Record<string, string> = {}, queryParams: Record<string, string> = {}): any {
  const paramMap = convertToParamMap(params);
  const queryParamMap = convertToParamMap(queryParams);
  const route: any = {
    snapshot: {
      paramMap,
      queryParamMap,
      params,
      queryParams,
      data: {},
      url: [],
      fragment: null,
      children: [],
      firstChild: null,
      routeConfig: null
    },
    params: of(params),
    queryParams: of(queryParams),
    paramMap: of(paramMap),
    queryParamMap: of(queryParamMap),
    data: of({}),
    url: of([]),
    fragment: of(null),
    outlet: 'primary',
    component: null,
    routeConfig: null,
    children: [],
    firstChild: null,
    parent: null,
    pathFromRoot: []
  };
  route.root = route;
  route.snapshot.root = route.snapshot;
  return route;
}

export function createRouterStub(): any {
  return {
    events: EMPTY,
    url: '/',
    navigate: async () => true,
    navigateByUrl: async () => true,
    createUrlTree: () => ({}),
    serializeUrl: () => '',
    isActive: () => false
  };
}

export function createMatDialogStub(): any {
  return {
    openDialogs: [],
    afterAllClosed: of(undefined),
    afterOpened: EMPTY,
    open: () => ({
      afterClosed: () => of(undefined),
      afterOpened: () => of(undefined),
      close: () => undefined,
      componentInstance: {}
    }),
    closeAll: () => undefined,
    getDialogById: () => undefined
  };
}

/** Sesión staff simulada (sin Firebase Auth). */
export function createAuthServiceStub(): any {
  return {
    login: async () => undefined,
    logout: () => undefined,
    signOutOnly: async () => undefined,
    waitForAuthUser: async () => null,
    getRememberedAuthUser: async () => null,
    getActiveAuthUser: async () => null,
    ensureActiveSession: async () => false,
    isAuthenticated: () => of(false),
    isAuthenticatedOnce: async () => false,
    getCurrentUser: () => of(null)
  };
}

export function createAuthProfileServiceStub(role = 'admin'): any {
  return {
    getMyProfile: async () => null,
    getAccessFromClaims: async () => ({ isStaff: true, isClient: false, staffRole: role, clienteId: null }),
    resolveAccess: async () => ({ isStaff: true, isClient: false, staffRole: role, clienteId: null, perfil: null }),
    hasStaffAccess: async () => true,
    hasClientAccess: async () => false,
    mustChangePassword: async () => false,
    isDual: async () => false,
    getClienteId: async () => null,
    isAdministrator: async () => role === 'admin',
    getEffectiveStaffRole: async () => role,
    canAccessModule: async () => true,
    getAccessibleModules: async () => [],
    isStaff: async () => true,
    isClient: async () => false
  };
}

export function createCurrentStaffServiceStub(): any {
  return {
    getStaffId: async () => 'staff-test',
    getStaffLabel: async () => 'Staff Test'
  };
}

export function createFirebaseFunctionsServiceStub(): any {
  return {
    syncMyClaims: async () => null,
    provisionStaffUser: async () => ({}),
    updateStaffUser: async () => ({}),
    provisionPortalClient: async () => ({}),
    registerPortalOwner: async () => ({}),
    deactivatePortalClient: async () => ({}),
    resendPortalClientAccess: async () => ({}),
    linkStaffPortalCliente: async () => ({}),
    unlinkStaffPortalCliente: async () => ({}),
    clearMustChangePassword: async () => ({})
  };
}

/** Pipes propias usadas en templates admin (necesarias aunque se use NO_ERRORS_SCHEMA). */
export const ADMIN_TEST_DECLARATIONS = [AdminEstadoClassPipe, AdminPrioridadClassPipe];

/**
 * Módulos mínimos para compilar templates admin bajo NO_ERRORS_SCHEMA. Menu/Autocomplete son
 * necesarios porque los templates usan exports (`#menu="matMenu"`, `#auto="matAutocomplete"`),
 * que el esquema laxo no puede ignorar.
 */
export const ADMIN_TEST_IMPORTS = [NoopAnimationsModule, MatMenuModule, MatAutocompleteModule];

/**
 * Providers para montar un componente admin sin Firebase real: AngularFire (DB/Auth/Functions/Storage),
 * Router/ActivatedRoute, MatDialog y servicios de sesión staff. Los servicios de datos reales
 * (ClientesService, CitasService, ...) se ejecutan contra el stub de RTDB y reciben listas vacías.
 */
export function provideAdminTestStubs(overrides: Provider[] = []): Provider[] {
  return [
    { provide: AngularFireDatabase, useValue: createAngularFireDatabaseStub() },
    { provide: AngularFireAuth, useValue: createAngularFireAuthStub() },
    { provide: AngularFireFunctions, useValue: createAngularFireFunctionsStub() },
    { provide: AngularFireStorage, useValue: createAngularFireStorageStub() },
    { provide: ActivatedRoute, useValue: createActivatedRouteStub() },
    { provide: Router, useValue: createRouterStub() },
    { provide: MatDialog, useValue: createMatDialogStub() },
    { provide: AuthService, useValue: createAuthServiceStub() },
    { provide: AuthProfileService, useValue: createAuthProfileServiceStub() },
    { provide: CurrentStaffService, useValue: createCurrentStaffServiceStub() },
    { provide: FirebaseFunctionsService, useValue: createFirebaseFunctionsServiceStub() },
    ...overrides
  ];
}
