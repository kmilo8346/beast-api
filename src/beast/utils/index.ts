class Utils {
  public mapObject<T>(data: T, source: string[] | undefined): Partial<T> {
    if (!source) return data;

    const result: { [key: string]: any } = {};
    source.forEach((key) => {
      result[key] = (data as { [key: string]: any })[key];
    });
    return result as T;
  }

  public mapArray<T>(data: T[], source: string[] | undefined): Partial<T>[] {
    if (!source) return data;

    return data.map((d) => this.mapObject<T>(d, source));
  }
}

export default new Utils();
