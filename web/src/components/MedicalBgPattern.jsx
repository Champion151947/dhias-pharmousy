export function MedicalBgPattern({ width = 400, height = 400, ...props }) {
  return (
    <svg width={width} height={height} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <defs>
        <pattern id="pillPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g className="pattern-pill">
            <ellipse cx="40" cy="40" rx="18" ry="10" fill="#0d9488" opacity="0.08">
              <animate attributeName="ry" values="10;8;10" dur="3s" repeatCount="indefinite"/>
            </ellipse>
            <rect x="32" y="30" width="16" height="20" rx="4" fill="#fff" opacity="0.1"/>
          </g>
        </pattern>
        
        <pattern id="crossPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <g className="pattern-cross">
            <rect x="27" y="10" width="6" height="40" rx="3" fill="#06b6d4" opacity="0.05">
              <animate attributeName="height" values="40;35;40" dur="2.5s" repeatCount="indefinite"/>
            </rect>
            <rect x="10" y="27" width="40" height="6" rx="3" fill="#06b6d4" opacity="0.05">
              <animate attributeName="width" values="40;35;40" dur="2.5s" repeatCount="indefinite"/>
            </rect>
          </g>
        </pattern>
        
        <pattern id="capsulePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <g className="pattern-capsule">
            <rect x="35" y="30" width="30" height="40" rx="15" fill="#0d9488" opacity="0.06">
              <animate attributeName="height" values="40;35;40" dur="3.5s" repeatCount="indefinite"/>
            </rect>
            <rect x="39" y="34" width="22" height="10" rx="5" fill="#fff" opacity="0.1"/>
            <rect x="39" y="56" width="22" height="10" rx="5" fill="#fff" opacity="0.08"/>
          </g>
        </pattern>
      </defs>
      
      <rect width="400" height="400" fill="url(#pillPattern)">
        <animateTransform attributeName="transform" type="translate" values="0,0; 40,40; 0,0" dur="20s" repeatCount="indefinite"/>
      </rect>
      
      <rect width="400" height="400" fill="url(#crossPattern)" opacity="0.5">
        <animateTransform attributeName="transform" type="translate" values="0,0; -30,-30; 0,0" dur="15s" repeatCount="indefinite"/>
      </rect>
      
      <rect width="400" height="400" fill="url(#capsulePattern)" opacity="0.3">
        <animateTransform attributeName="transform" type="translate" values="0,0; 50,-50; 0,0" dur="25s" repeatCount="indefinite"/>
      </rect>
      
      <g className="particles">
        <circle cx="50" cy="50" r="3" fill="#0d9488" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="1;5;1" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="50;30;50" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="100" r="3" fill="#06b6d4" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="3.5s" repeatCount="indefinite" begin="1s"/>
          <animate attributeName="r" values="1;4;1" dur="3.5s" repeatCount="indefinite" begin="1s"/>
          <animate attributeName="cx" values="150;170;150" dur="3.5s" repeatCount="indefinite" begin="1s"/>
        </circle>
        <circle cx="300" cy="80" r="3" fill="#14b8a6" opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur="4.5s" repeatCount="indefinite" begin="2s"/>
          <animate attributeName="r" values="1;6;1" dur="4.5s" repeatCount="indefinite" begin="2s"/>
          <animate attributeName="cy" values="80;60;80" dur="4.5s" repeatCount="indefinite" begin="2s"/>
        </circle>
        <circle cx="100" cy="200" r="3" fill="#0d9488" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite" begin="0.5s"/>
          <animate attributeName="r" values="1;4;1" dur="3s" repeatCount="indefinite" begin="0.5s"/>
        </circle>
        <circle cx="250" cy="180" r="3" fill="#06b6d4" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" begin="1.5s"/>
          <animate attributeName="r" values="1;5;1" dur="4s" repeatCount="indefinite" begin="1.5s"/>
          <animate attributeName="cx" values="250;230;250" dur="4s" repeatCount="indefinite" begin="1.5s"/>
        </circle>
        <circle cx="350" cy="300" r="3" fill="#14b8a6" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="3.5s" repeatCount="indefinite" begin="2.5s"/>
          <animate attributeName="r" values="1;4;1" dur="3.5s" repeatCount="indefinite" begin="2.5s"/>
          <animate attributeName="cy" values="300;280;300" dur="3.5s" repeatCount="indefinite" begin="2.5s"/>
        </circle>
        <circle cx="80" cy="320" r="3" fill="#0d9488" opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur="4.2s" repeatCount="indefinite" begin="3s"/>
          <animate attributeName="r" values="1;6;1" dur="4.2s" repeatCount="indefinite" begin="3s"/>
          <animate attributeName="cx" values="80;100;80" dur="4.2s" repeatCount="indefinite" begin="3s"/>
        </circle>
        <circle cx="200" cy="350" r="3" fill="#06b6d4" opacity="0">
          <animate attributeName="opacity" values="0;0.5;0" dur="3.8s" repeatCount="indefinite" begin="0.8s"/>
          <animate attributeName="r" values="1;5;1" dur="3.8s" repeatCount="indefinite" begin="0.8s"/>
        </circle>
        <circle cx="320" cy="320" r="3" fill="#14b8a6" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur="4.3s" repeatCount="indefinite" begin="2s"/>
          <animate attributeName="r" values="1;4;1" dur="4.3s" repeatCount="indefinite" begin="2s"/>
          <animate attributeName="cy" values="320;300;320" dur="4.3s" repeatCount="indefinite" begin="2s"/>
        </circle>
      </g>
      
      <g className="geo-shapes" opacity="0.03">
        <g transform="translate(100,100)">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="30s" repeatCount="indefinite"/>
          <polygon points="0,-30 26,15 -26,15" fill="#0d9488">
            <animate attributeName="points" values="0,-30 26,15 -26,15; 0,-35 30,17 -30,17; 0,-30 26,15 -26,15" dur="4s" repeatCount="indefinite"/>
          </polygon>
        </g>
        
        <g transform="translate(300,200)">
          <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="25s" repeatCount="indefinite"/>
          <rect x="-20" y="-20" width="40" height="40" fill="#06b6d4">
            <animate attributeName="width" values="40;30;40" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="height" values="40;30;40" dur="3s" repeatCount="indefinite"/>
          </rect>
        </g>
        
        <g transform="translate(200,300)">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="20s" repeatCount="indefinite"/>
          <circle r="25" fill="#14b8a6">
            <animate attributeName="r" values="25;20;25" dur="3.5s" repeatCount="indefinite"/>
          </circle>
        </g>
      </g>
    </svg>
  );
}