import steps from "../data/steps";

function PipelineSteps() {

  return (

    <div>

      <div className="slabel">Pipeline</div>

      <div className="pipe-card">

        {steps.map((step,i)=>(
          <div key={i} className="step">
            {step}
          </div>
        ))}

      </div>

    </div>

  );

}

export default PipelineSteps;