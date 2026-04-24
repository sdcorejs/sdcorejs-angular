describe('sd-angular public API', () => {
  it('loads the library entrypoint', async () => {
    await import('./public-api');

    expect(true).toBeTrue();
  });
});