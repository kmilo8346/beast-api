class Utils {
  public mapObject(
    data: { [key: string]: any },
    source: string[] | undefined,
  ): { [key: string]: any } {
    if (!source) return data;

    const result: { [key: string]: any } = {};
    source.forEach((key) => {
      result[key] = data[key];
    });
    return result;
  }

  public mapArray(
    data: { [key: string]: any }[],
    source: string[] | undefined,
  ): { [key: string]: any }[] {
    if (!source) return data;

    return data.map((d) => this.mapObject(d, source));
  }
}

export default new Utils();
