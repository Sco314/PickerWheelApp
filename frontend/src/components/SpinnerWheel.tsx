type Props = {
  picked: string | null;
  spinning: boolean;
};

export default function SpinnerWheel({ picked, spinning }: Props) {
  return (
    <section>
      <h2>Spinner</h2>
      <div className={spinning ? 'spinner spinning' : 'spinner'}>{picked ? `Last pick: ${picked}` : 'Ready to spin'}</div>
    </section>
  );
}
