type Props = {
  picked: string | null;
};

export default function SpinnerWheel({ picked }: Props) {
  return (
    <section>
      <h2>Spinner</h2>
      <div>{picked ? `Last pick: ${picked}` : 'Ready to spin'}</div>
    </section>
  );
}
