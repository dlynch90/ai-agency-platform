#!/usr/bin/env python3
"""
FEA Gap Analysis with Infinitesimal Decomposition & Ontology-Based Task Decomposition
Debugged version with comprehensive instrumentation
"""

import numpy as np
import scipy.sparse as sp
import matplotlib.pyplot as plt
import json
import os
import sys
import time
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from collections import defaultdict
import urllib.request
import urllib.parse

# #region agent log - Debug Instrumentation
LOG_ENDPOINT = "http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab"
LOG_PATH = "${HOME}/Developer/.cursor/debug.log"

def log_debug(hypothesis_id: str, location: str, message: str, data: dict):
    """Send debug log to endpoint"""
    payload = {
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data,
        "sessionId": "fea-gap-debug",
        "runId": "infinitesimal-decomposition",
        "hypothesisId": hypothesis_id
    }
    try:
        req = urllib.request.Request(
            LOG_ENDPOINT,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=1).read()
    except Exception:
        # Fallback to file logging
        try:
            with open(LOG_PATH, 'a') as f:
                f.write(json.dumps(payload) + '\n')
        except Exception:
            pass
# #endregion

@dataclass
class OntologyTask:
    """Ontology-based task decomposition"""
    task_id: str
    ontology_class: str  # e.g., "StructuralAnalysis", "MaterialModeling"
    parent_task: Optional[str]
    child_tasks: List[str]
    atomic_operations: List[str]  # Infinitesimal decomposition
    dependencies: List[str]
    state: str  # pending, in_progress, completed, failed
    metrics: Dict[str, float]

@dataclass
class InfinitesimalElement:
    """Infinitesimal decomposition of finite element"""
    element_id: str
    parent_element: str
    atomic_properties: Dict[str, Any]
    micro_states: List[str]
    decomposition_level: int  # 0 = root, higher = more granular
    connections: List[str]

class FEAGapAnalysisDebug:
    """FEA Gap Analysis with infinitesimal decomposition and ontology-based tasks"""
    
    def __init__(self, workspace: Path = None):
        self.workspace = workspace or Path(os.getenv('DEVELOPER_DIR', os.path.expanduser('~/Developer')))
        self.capabilities = self._initialize_capabilities()
        self.gaps = []
        
        # Ontology-based task decomposition
        self.ontology_tasks: Dict[str, OntologyTask] = {}
        self.task_ontology = self._build_task_ontology()
        
        # Infinitesimal decomposition
        self.infinitesimal_elements: Dict[str, InfinitesimalElement] = {}
        self.decomposition_tree = {}
        
        log_debug("A", "FEAGapAnalysisDebug.__init__", "Initialized analyzer", {
            "workspace": str(self.workspace),
            "capabilities_count": sum(len(v) for v in self.capabilities.values()),
            "ontology_classes": len(self.task_ontology)
        })
    
    def _initialize_capabilities(self) -> Dict:
        """Initialize capability matrix"""
        log_debug("A", "_initialize_capabilities", "Initializing capabilities", {})
        return {
            "structural": {
                "linear_static": False,
                "nonlinear_static": False,
                "modal": False,
                "transient": False,
                "buckling": False
            },
            "thermal": {
                "steady_state": False,
                "transient": False,
                "coupled": False
            },
            "fluid": {
                "laminar": False,
                "turbulent": False,
                "multiphase": False
            },
            "multiphysics": {
                "thermo_mechanical": False,
                "fluid_structure": False,
                "electro_mechanical": False
            },
            "materials": {
                "linear_elastic": False,
                "hyperelastic": False,
                "plastic": False,
                "composite": False
            },
            "elements": {
                "tetrahedral": False,
                "hexahedral": False,
                "shell": False,
                "beam": False
            },
            "solvers": {
                "direct": False,
                "iterative": False,
                "multigrid": False
            },
            "post_processing": {
                "stress_analysis": False,
                "deformation": False,
                "animations": False
            }
        }
    
    def _build_task_ontology(self) -> Dict[str, Dict]:
        """Build ontology-based task decomposition structure"""
        log_debug("B", "_build_task_ontology", "Building task ontology", {})
        
        ontology = {
            "StructuralAnalysis": {
                "parent": None,
                "children": ["LinearAnalysis", "NonlinearAnalysis", "ModalAnalysis"],
                "atomic_ops": [
                    "mesh_generation",
                    "stiffness_assembly",
                    "boundary_condition_application",
                    "load_application",
                    "solver_execution",
                    "result_extraction"
                ]
            },
            "LinearAnalysis": {
                "parent": "StructuralAnalysis",
                "children": ["StaticLinear", "DynamicLinear"],
                "atomic_ops": [
                    "linear_stiffness_matrix",
                    "linear_solver",
                    "displacement_calculation"
                ]
            },
            "ThermalAnalysis": {
                "parent": None,
                "children": ["SteadyStateThermal", "TransientThermal", "CoupledThermal"],
                "atomic_ops": [
                    "temperature_field_definition",
                    "thermal_boundary_conditions",
                    "heat_flux_calculation",
                    "thermal_gradient_computation",
                    "convergence_check"
                ]
            },
            "FluidAnalysis": {
                "parent": None,
                "children": ["LaminarFlow", "TurbulentFlow", "MultiphaseFlow"],
                "atomic_ops": [
                    "velocity_field_definition",
                    "pressure_field_definition",
                    "navier_stokes_solution",
                    "turbulence_modeling",
                    "boundary_layer_analysis"
                ]
            },
            "MultiphysicsAnalysis": {
                "parent": None,
                "children": ["ThermoMechanical", "FluidStructure", "ElectroMechanical"],
                "atomic_ops": [
                    "coupling_definition",
                    "field_transfer",
                    "iterative_coupling",
                    "convergence_monitoring",
                    "result_synchronization"
                ]
            },
            "MaterialModeling": {
                "parent": None,
                "children": ["ElasticModel", "PlasticModel", "CompositeModel"],
                "atomic_ops": [
                    "material_property_definition",
                    "constitutive_relation",
                    "stress_strain_calculation",
                    "failure_criteria",
                    "material_validation"
                ]
            },
            "MeshGeneration": {
                "parent": None,
                "children": ["TetrahedralMesh", "HexahedralMesh", "HybridMesh"],
                "atomic_ops": [
                    "geometry_import",
                    "mesh_parameter_definition",
                    "element_generation",
                    "mesh_quality_check",
                    "mesh_refinement"
                ]
            },
            "SolverExecution": {
                "parent": None,
                "children": ["DirectSolver", "IterativeSolver", "MultigridSolver"],
                "atomic_ops": [
                    "matrix_factorization",
                    "linear_system_solution",
                    "convergence_check",
                    "result_validation",
                    "error_estimation"
                ]
            },
            "PostProcessing": {
                "parent": None,
                "children": ["StressAnalysis", "DeformationAnalysis", "Visualization"],
                "atomic_ops": [
                    "data_extraction",
                    "stress_calculation",
                    "deformation_visualization",
                    "animation_generation",
                    "report_generation"
                ]
            }
        }
        
        log_debug("B", "_build_task_ontology", "Task ontology built", {
            "ontology_classes": len(ontology),
            "total_atomic_ops": sum(len(v["atomic_ops"]) for v in ontology.values())
        })
        
        return ontology
    
    def decompose_infinitesimally(self, element_id: str, element_type: str, max_depth: int = 5) -> List[InfinitesimalElement]:
        """Infinitesimal decomposition of finite element"""
        log_debug("C", "decompose_infinitesimally", "Starting infinitesimal decomposition", {
            "element_id": element_id,
            "element_type": element_type,
            "max_depth": max_depth
        })
        
        decomposed = []
        decomposition_queue = [(element_id, element_type, 0, None)]
        
        while decomposition_queue:
            current_id, current_type, depth, parent = decomposition_queue.pop(0)
            
            if depth > max_depth:
                log_debug("C", "decompose_infinitesimally", "Max depth reached", {
                    "element_id": current_id,
                    "depth": depth
                })
                continue
            
            # Atomic properties for this level
            atomic_props = self._get_atomic_properties(current_type, depth)
            micro_states = self._get_micro_states(current_type, depth)
            
            # Create infinitesimal element
            inf_element = InfinitesimalElement(
                element_id=f"{current_id}_inf_{depth}",
                parent_element=parent or current_id,
                atomic_properties=atomic_props,
                micro_states=micro_states,
                decomposition_level=depth,
                connections=[]
            )
            
            decomposed.append(inf_element)
            self.infinitesimal_elements[inf_element.element_id] = inf_element
            
            log_debug("C", "decompose_infinitesimally", "Created infinitesimal element", {
                "element_id": inf_element.element_id,
                "depth": depth,
                "atomic_props_count": len(atomic_props),
                "micro_states_count": len(micro_states)
            })
            
            # Decompose further if not at max depth
            if depth < max_depth:
                sub_elements = self._get_sub_elements(current_type, depth)
                for sub_elem in sub_elements:
                    sub_id = f"{current_id}_{sub_elem}"
                    decomposition_queue.append((sub_id, sub_elem, depth + 1, inf_element.element_id))
        
        log_debug("C", "decompose_infinitesimally", "Infinitesimal decomposition complete", {
            "element_id": element_id,
            "total_decomposed": len(decomposed),
            "max_depth_achieved": max(d.decomposition_level for d in decomposed) if decomposed else 0
        })
        
        return decomposed
    
    def _get_atomic_properties(self, element_type: str, depth: int) -> Dict[str, Any]:
        """Get atomic properties for infinitesimal decomposition"""
        log_debug("C", "_get_atomic_properties", "Getting atomic properties", {
            "element_type": element_type,
            "depth": depth
        })
        
        properties_map = {
            "structural": {
                0: {"mass": 1.0, "stiffness": 1.0, "damping": 0.1, "element_type": "structural"},
                1: {"node_count": 0, "element_count": 0, "dof": 0},
                2: {"stress": 0.0, "strain": 0.0, "displacement": 0.0},
                3: {"integration_points": 0, "shape_functions": []},
                4: {"jacobian": None, "b_matrix": None}
            },
            "material": {
                0: {"E": 200e9, "nu": 0.3, "rho": 7800, "element_type": "material"},
                1: {"yield_strength": 250e6, "ultimate_strength": 400e6},
                2: {"stress_strain_curve": []},
                3: {"microstructure": {}}
            },
            "linear": {
                0: {"linearity": True, "stiffness_type": "constant", "element_type": "linear"},
                1: {"stiffness_matrix": None, "load_vector": None},
                2: {"displacement": 0.0, "force": 0.0}
            },
            "nonlinear": {
                0: {"linearity": False, "stiffness_type": "variable", "element_type": "nonlinear"},
                1: {"tangent_stiffness": None, "residual": None},
                2: {"convergence": False, "iteration": 0}
            },
            "modal": {
                0: {"frequency": 0.0, "mode_shape": None, "element_type": "modal"},
                1: {"eigenvalue": 0.0, "eigenvector": None}
            },
            "thermal": {
                0: {"temperature": 0.0, "conductivity": 0.0, "element_type": "thermal"},
                1: {"heat_flux": 0.0, "thermal_gradient": None}
            },
            "fluid": {
                0: {"velocity": 0.0, "pressure": 0.0, "element_type": "fluid"},
                1: {"vorticity": 0.0, "stream_function": None}
            },
            "element": {
                0: {"element_shape": "unknown", "nodes_per_element": 0, "element_type": "element"},
                1: {"connectivity": [], "coordinates": []}
            },
            "solver": {
                0: {"solver_type": "unknown", "converged": False, "element_type": "solver"},
                1: {"iterations": 0, "residual": 0.0}
            },
            "post": {
                0: {"visualization_type": "unknown", "element_type": "post"},
                1: {"data_points": 0, "render_quality": "medium"}
            }
        }
        
        # Try multiple matching strategies
        base_type = element_type.split("_")[0] if "_" in element_type else element_type
        
        # Check for specific matches first
        if element_type in properties_map:
            result = properties_map[element_type].get(depth, {})
        elif base_type in properties_map:
            result = properties_map[base_type].get(depth, {})
        else:
            # Default properties for unknown types
            result = {
                "element_type": element_type,
                "depth": depth,
                "properties_defined": False
            }
        
        log_debug("C", "_get_atomic_properties", "Atomic properties retrieved", {
            "element_type": element_type,
            "depth": depth,
            "properties_count": len(result),
            "base_type": base_type
        })
        
        return result
    
    def _get_micro_states(self, element_type: str, depth: int) -> List[str]:
        """Get micro-states for infinitesimal decomposition"""
        log_debug("C", "_get_micro_states", "Getting micro states", {
            "element_type": element_type,
            "depth": depth
        })
        
        states_map = {
            "structural": ["undeformed", "deformed", "equilibrium", "converged"],
            "linear": ["initialized", "assembled", "solved", "converged"],
            "nonlinear": ["initialized", "iterating", "converging", "converged", "diverged"],
            "modal": ["initialized", "eigenvalue_extraction", "mode_shape_calculation", "completed"],
            "transient": ["initialized", "time_stepping", "converged", "completed"],
            "buckling": ["initialized", "critical_load_search", "mode_extraction", "completed"],
            "material": ["elastic", "plastic", "yielded", "failed"],
            "elastic": ["linear_elastic", "nonlinear_elastic", "hyperelastic"],
            "plastic": ["elastic_range", "yield_point", "plastic_range", "failure"],
            "composite": ["intact", "delamination", "fiber_failure", "matrix_failure"],
            "thermal": ["initialized", "temperature_field", "converged", "steady_state"],
            "fluid": ["initialized", "velocity_field", "pressure_field", "converged"],
            "element": ["created", "meshed", "assembled", "solved"],
            "tetrahedral": ["created", "quality_checked", "assembled", "solved"],
            "hexahedral": ["created", "quality_checked", "assembled", "solved"],
            "shell": ["created", "thickness_assigned", "assembled", "solved"],
            "beam": ["created", "cross_section_assigned", "assembled", "solved"],
            "solver": ["initialized", "iterating", "converging", "converged", "failed"],
            "direct": ["factorized", "forward_substitution", "backward_substitution", "completed"],
            "iterative": ["initialized", "preconditioned", "iterating", "converged"],
            "post": ["data_extracted", "processed", "visualized", "reported"],
            "stress": ["calculated", "principal_extracted", "von_mises_computed", "visualized"],
            "deformation": ["displacement_calculated", "strain_computed", "visualized", "animated"]
        }
        
        # Try multiple matching strategies
        if element_type in states_map:
            result = states_map[element_type]
        else:
            # Extract parts
            parts = element_type.split("_")
            base_type = parts[0] if parts else element_type
            
            # Try base type
            if base_type in states_map:
                result = states_map[base_type]
            else:
                # Try second part if exists
                if len(parts) > 1 and parts[1] in states_map:
                    result = states_map[parts[1]]
                else:
                    # Try combined matching
                    for key in states_map:
                        if key in element_type or element_type in key:
                            result = states_map[key]
                            break
                    else:
                        # Default states based on depth
                        if depth == 0:
                            result = ["initialized", "processing"]
                        elif depth == 1:
                            result = ["decomposed", "analyzing"]
                        elif depth == 2:
                            result = ["refined", "validating"]
                        else:
                            result = ["atomic", "finalized"]
        
        log_debug("C", "_get_micro_states", "Micro states retrieved", {
            "element_type": element_type,
            "depth": depth,
            "states_count": len(result),
            "states": result
        })
        
        return result
    
    def _get_sub_elements(self, element_type: str, depth: int) -> List[str]:
        """Get sub-elements for further decomposition"""
        log_debug("C", "_get_sub_elements", "Getting sub-elements", {
            "element_type": element_type,
            "depth": depth
        })
        
        if depth >= 4:
            return []  # Stop at depth 4
        
        # Enhanced sub-element mapping with better matching
        sub_map = {
            "structural": ["node", "element", "integration_point", "gauss_point"],
            "linear": ["stiffness_matrix", "load_vector", "displacement_field"],
            "nonlinear": ["tangent_stiffness", "residual", "iteration_state"],
            "modal": ["eigenvalue", "eigenvector", "mode_shape"],
            "transient": ["time_step", "state_vector", "time_history"],
            "buckling": ["critical_load", "buckling_mode", "stability_factor"],
            "material": ["grain", "phase", "boundary", "interface"],
            "elastic": ["young_modulus", "poisson_ratio", "density"],
            "plastic": ["yield_stress", "hardening", "flow_rule"],
            "composite": ["layer", "fiber", "matrix", "interface"],
            "thermal": ["temperature_field", "heat_flux", "thermal_gradient"],
            "fluid": ["velocity_field", "pressure_field", "vorticity"],
            "element": ["node", "edge", "face", "volume"],
            "tetrahedral": ["node", "edge", "face", "volume"],
            "hexahedral": ["node", "edge", "face", "volume"],
            "shell": ["node", "edge", "surface", "thickness"],
            "beam": ["node", "axis", "cross_section", "length"],
            "solver": ["matrix", "vector", "residual", "jacobian"],
            "direct": ["factorization", "forward_substitution", "backward_substitution"],
            "iterative": ["preconditioner", "iteration", "convergence"],
            "post": ["visualization", "data_extraction", "analysis"],
            "stress": ["stress_tensor", "principal_stress", "von_mises"],
            "deformation": ["displacement", "strain", "rotation"]
        }
        
        # Try multiple matching strategies
        if element_type in sub_map:
            result = sub_map[element_type]
        else:
            # Extract base type
            parts = element_type.split("_")
            base_type = parts[0] if parts else element_type
            
            # Try base type
            if base_type in sub_map:
                result = sub_map[base_type]
            else:
                # Try second part if exists
                if len(parts) > 1 and parts[1] in sub_map:
                    result = sub_map[parts[1]]
                else:
                    # Default sub-elements for unknown types
                    result = ["component_1", "component_2", "component_3"]
        
        log_debug("C", "_get_sub_elements", "Sub-elements retrieved", {
            "element_type": element_type,
            "depth": depth,
            "sub_elements_count": len(result),
            "sub_elements": result[:3]  # First 3 for logging
        })
        
        return result
    
    def create_ontology_task(self, ontology_class: str, task_id: str = None) -> OntologyTask:
        """Create ontology-based task"""
        log_debug("B", "create_ontology_task", "Creating ontology task", {
            "ontology_class": ontology_class,
            "task_id": task_id
        })
        
        if ontology_class not in self.task_ontology:
            log_debug("B", "create_ontology_task", "Unknown ontology class", {
                "ontology_class": ontology_class
            })
            return None
        
        ontology_def = self.task_ontology[ontology_class]
        task_id = task_id or f"{ontology_class}_{int(time.time())}"
        
        task = OntologyTask(
            task_id=task_id,
            ontology_class=ontology_class,
            parent_task=ontology_def["parent"],
            child_tasks=ontology_def["children"],
            atomic_operations=ontology_def["atomic_ops"],
            dependencies=[],
            state="pending",
            metrics={}
        )
        
        self.ontology_tasks[task_id] = task
        
        log_debug("B", "create_ontology_task", "Ontology task created", {
            "task_id": task_id,
            "atomic_ops_count": len(task.atomic_operations),
            "children_count": len(task.child_tasks)
        })
        
        return task
    
    def analyze_current_capabilities(self):
        """Analyze current FEA capabilities with infinitesimal decomposition"""
        log_debug("A", "analyze_current_capabilities", "Starting capability analysis", {})
        
        print("🔬 ANALYZING CURRENT FEA CAPABILITIES (Infinitesimal Decomposition)")
        
        # Decompose each capability category infinitesimally
        category_to_ontology = {
            "structural": "StructuralAnalysis",
            "thermal": "ThermalAnalysis",
            "fluid": "FluidAnalysis",
            "multiphysics": "MultiphysicsAnalysis",
            "materials": "MaterialModeling",
            "elements": "MeshGeneration",
            "solvers": "SolverExecution",
            "post_processing": "PostProcessing"
        }
        
        for category, capabilities in self.capabilities.items():
            log_debug("A", "analyze_current_capabilities", "Analyzing category", {
                "category": category,
                "capabilities_count": len(capabilities)
            })
            
            # Create ontology task for this category
            ontology_class = category_to_ontology.get(category, f"{category.capitalize()}Analysis")
            task = self.create_ontology_task(ontology_class)
            if task:
                task.state = "in_progress"
                log_debug("B", "analyze_current_capabilities", "Task started", {
                    "task_id": task.task_id,
                    "category": category,
                    "ontology_class": ontology_class
                })
            else:
                log_debug("B", "analyze_current_capabilities", "Task creation failed", {
                    "category": category,
                    "ontology_class": ontology_class
                })
            
            # Decompose each capability infinitesimally
            for capability_name, available in capabilities.items():
                element_id = f"{category}_{capability_name}"
                
                # Infinitesimal decomposition
                decomposed = self.decompose_infinitesimally(element_id, capability_name, max_depth=3)
                
                log_debug("C", "analyze_current_capabilities", "Capability decomposed", {
                    "element_id": element_id,
                    "decomposed_count": len(decomposed),
                    "available": available
                })
                
                # Check for library availability
                if not available:
                    self._check_library_availability(category, capability_name, decomposed)
            
            if task:
                task.state = "completed"
                log_debug("B", "analyze_current_capabilities", "Task completed", {
                    "task_id": task.task_id
                })
        
        log_debug("A", "analyze_current_capabilities", "Capability analysis complete", {
            "total_elements": len(self.infinitesimal_elements),
            "total_tasks": len(self.ontology_tasks)
        })
    
    def _check_library_availability(self, category: str, capability: str, decomposed: List[InfinitesimalElement]):
        """Check library availability with infinitesimal granularity"""
        log_debug("A", "_check_library_availability", "Checking library", {
            "category": category,
            "capability": capability
        })
        
        library_map = {
            "structural": {
                "linear_static": ["fenics", "dolfin"],
                "nonlinear_static": ["fenics", "dolfin"],
                "modal": ["scipy", "numpy"]
            },
            "elements": {
                "tetrahedral": ["pygmsh", "gmsh"],
                "hexahedral": ["pygmsh", "gmsh"]
            },
            "post_processing": {
                "stress_analysis": ["pyvista", "vtk"],
                "deformation": ["pyvista", "matplotlib"]
            },
            "materials": {
                "composite": ["pymatgen"]
            }
        }
        
        libraries = library_map.get(category, {}).get(capability, [])
        
        for lib in libraries:
            try:
                __import__(lib)
                self.capabilities[category][capability] = True
                log_debug("A", "_check_library_availability", "Library found", {
                    "library": lib,
                    "category": category,
                    "capability": capability
                })
                print(f"✅ {lib} detected - {capability.replace('_', ' ').title()} available")
                break
            except ImportError:
                log_debug("A", "_check_library_availability", "Library missing", {
                    "library": lib,
                    "category": category,
                    "capability": capability
                })
                if lib not in [g.split(':')[0] for g in self.gaps]:
                    self.gaps.append(f"{lib} missing for {capability.replace('_', ' ')}")
        
        # Check infinitesimal elements
        for inf_elem in decomposed:
            if not inf_elem.atomic_properties:
                log_debug("C", "_check_library_availability", "Missing atomic properties", {
                    "element_id": inf_elem.element_id,
                    "decomposition_level": inf_elem.decomposition_level
                })
    
    def generate_ontology_report(self) -> Dict:
        """Generate ontology-based task decomposition report"""
        log_debug("B", "generate_ontology_report", "Generating ontology report", {})
        
        report = {
            "ontology_structure": {},
            "task_decomposition": {},
            "infinitesimal_elements": {},
            "metrics": {}
        }
        
        # Ontology structure
        for class_name, definition in self.task_ontology.items():
            report["ontology_structure"][class_name] = {
                "parent": definition["parent"],
                "children": definition["children"],
                "atomic_operations": definition["atomic_ops"],
                "task_count": len([t for t in self.ontology_tasks.values() if t.ontology_class == class_name])
            }
        
        # Task decomposition
        for task_id, task in self.ontology_tasks.items():
            report["task_decomposition"][task_id] = {
                "ontology_class": task.ontology_class,
                "state": task.state,
                "atomic_operations": task.atomic_operations,
                "metrics": task.metrics
            }
        
        # Infinitesimal elements
        for elem_id, elem in list(self.infinitesimal_elements.items())[:100]:  # Limit for report
            report["infinitesimal_elements"][elem_id] = {
                "parent": elem.parent_element,
                "decomposition_level": elem.decomposition_level,
                "atomic_properties_count": len(elem.atomic_properties),
                "micro_states": elem.micro_states
            }
        
        # Metrics
        report["metrics"] = {
            "total_ontology_classes": len(self.task_ontology),
            "total_tasks": len(self.ontology_tasks),
            "total_infinitesimal_elements": len(self.infinitesimal_elements),
            "max_decomposition_depth": max(
                (e.decomposition_level for e in self.infinitesimal_elements.values()),
                default=0
            ),
            "completed_tasks": len([t for t in self.ontology_tasks.values() if t.state == "completed"])
        }
        
        log_debug("B", "generate_ontology_report", "Ontology report generated", report["metrics"])
        
        return report
    
    def run_gap_analysis(self):
        """Run complete FEA gap analysis with infinitesimal decomposition"""
        log_debug("A", "run_gap_analysis", "Starting gap analysis", {})
        
        print("🚀 FINITE ELEMENT ANALYSIS GAP ANALYSIS")
        print("=" * 50)
        print("With Infinitesimal Decomposition & Ontology-Based Task Decomposition")
        print()
        
        # Phase 1: Analyze capabilities with infinitesimal decomposition
        self.analyze_current_capabilities()
        
        # Phase 2: Generate ontology report
        ontology_report = self.generate_ontology_report()
        
        # Phase 3: Print results
        print("\n📊 FEA CAPABILITY MATRIX")
        print("-" * 30)
        for category, capabilities in self.capabilities.items():
            print(f"\n{category.upper()}:")
            for capability, available in capabilities.items():
                status = "✅" if available else "❌"
                print(f"  {status} {capability.replace('_', ' ').title()}")
        
        print("\n📋 IMPLEMENTATION GAPS")
        print("-" * 25)
        if self.gaps:
            for gap in self.gaps:
                print(f"❌ {gap}")
        else:
            print("✅ No major gaps identified")
        
        print("\n🎯 ONTOLOGY-BASED TASK DECOMPOSITION")
        print("-" * 40)
        print(f"Total Ontology Classes: {ontology_report['metrics']['total_ontology_classes']}")
        print(f"Total Tasks: {ontology_report['metrics']['total_tasks']}")
        print(f"Total Infinitesimal Elements: {ontology_report['metrics']['total_infinitesimal_elements']}")
        print(f"Max Decomposition Depth: {ontology_report['metrics']['max_decomposition_depth']}")
        
        print("\n🎯 RECOMMENDATIONS")
        print("-" * 20)
        print("1. Install advanced FEA libraries: ./scripts/install_fea_capabilities.sh")
        print("2. Implement proper element formulations (beam, shell, solid)")
        print("3. Add multi-physics coupling capabilities")
        print("4. Integrate with CAD systems for automated meshing")
        print("5. Implement parallel computing for large-scale problems")
        
        # Save results
        results = {
            'capabilities': self.capabilities,
            'gaps': self.gaps,
            'ontology_report': ontology_report,
            'recommendations': [
                "Install FEniCS, PyGmsh, PyVista, PyMatGen",
                "Implement proper finite element formulations",
                "Add multi-physics coupling (thermal, fluid)",
                "Integrate CAD import/export capabilities",
                "Implement parallel computing support"
            ]
        }
        
        report_path = self.workspace / 'configs' / 'fea_gap_analysis_debug.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        log_debug("A", "run_gap_analysis", "Gap analysis complete", {
            "report_path": str(report_path),
            "gaps_count": len(self.gaps),
            "capabilities_available": sum(
                sum(1 for v in caps.values() if v) 
                for caps in self.capabilities.values()
            )
        })
        
        print(f"\n💾 Results saved to: {report_path}")
        
        return results

if __name__ == "__main__":
    analyzer = FEAGapAnalysisDebug()
    results = analyzer.run_gap_analysis()
