import { PhaseInstruction } from './PhaseInstruction';

type PseudoWindowProps = {
  messageVisible: boolean;
  messageFading: boolean;
};

export function PseudoWindow({ messageVisible, messageFading }: PseudoWindowProps) {
  return (
    <>
      <div className="landscape" aria-hidden="true">
        <div className="scene-wash" />
        <div className="horizon-line" />
      </div>
      <PhaseInstruction
        title={'画面全体を、\nやわらかく見てみよう'}
        hint="一点を見つめなくて大丈夫"
        visible={messageVisible}
        fading={messageFading}
      />
    </>
  );
}
