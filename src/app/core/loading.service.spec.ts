import { LOADING_MESSAGES, LoadingService } from './loading.service';

describe('LoadingService', () => {
  let svc: LoadingService;

  beforeEach(() => {
    svc = new LoadingService();
  });

  it('empareja show/hide y apaga el overlay', (done) => {
    let last = false;
    svc.isLoading.subscribe((v) => (last = v));
    svc.show(LOADING_MESSAGES.saving);
    expect(last).toBe(true);
    svc.hide();
    expect(last).toBe(false);
    done();
  });

  it('forceHide apaga aunque el contador quede desbalanceado', (done) => {
    let last = true;
    svc.isLoading.subscribe((v) => (last = v));
    svc.show();
    svc.show();
    svc.forceHide();
    expect(last).toBe(false);
    done();
  });

  it('wrap siempre hace hide en success y error', async () => {
    await svc.wrap(async () => 1);
    let last = true;
    svc.isLoading.subscribe((v) => (last = v));
    expect(last).toBe(false);

    try {
      await svc.wrap(async () => {
        throw new Error('boom');
      });
    } catch {
      /* expected */
    }
    expect(last).toBe(false);
  });
});
