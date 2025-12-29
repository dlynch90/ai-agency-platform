#!/usr/bin/env python3
"""
FEA Solver Script using FEniCS/DOLFIN
Provides basic finite element analysis capabilities
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# #region agent log H2
import json
import time
log_data = {
    "fenics_attempted": False,
    "fenics_error": None,
    "pyvista_attempted": False,
    "pyvista_error": None
}
# #endregion

try:
    # #region agent log H2
    log_data["fenics_attempted"] = True
    # #endregion

    # Try to import FEniCS components
    from dolfin import *
    from mshr import *
    FENICS_AVAILABLE = True
    print("✓ FEniCS/DOLFIN available")

    # #region agent log H2
    log_data["fenics_success"] = True
    # #endregion

except ImportError as e:
    FENICS_AVAILABLE = False
    print("⚠ FEniCS not available, using fallback implementation")

    # #region agent log H2
    log_data["fenics_success"] = False
    log_data["fenics_error"] = str(e)
    # #endregion

try:
    # #region agent log H2
    log_data["pyvista_attempted"] = True
    # #endregion

    import pyvista as pv
    PYVISTA_AVAILABLE = True
    print("✓ PyVista available for visualization")

    # #region agent log H2
    log_data["pyvista_success"] = True
    # #endregion

except ImportError as e:
    PYVISTA_AVAILABLE = False
    print("⚠ PyVista not available")

    # #region agent log H2
    log_data["pyvista_success"] = False
    log_data["pyvista_error"] = str(e)
    # #endregion

# #region agent log H2
with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
    f.write(json.dumps({
        "id": f"log_{int(time.time()*1000)}_{'h2_fea_' + str(hash(str(time.time())))[:8]}",
        "timestamp": int(time.time()*1000),
        "location": "fea_solver.py:library_imports",
        "message": "FEA library import status",
        "data": log_data,
        "sessionId": "debug-fea-startup",
        "runId": "run-1",
        "hypothesisId": "H2"
    }) + '\n')
# #endregion

def create_simple_mesh():
    """Create a simple rectangular mesh for testing"""
    if FENICS_AVAILABLE:
        # Create rectangular domain
        domain = Rectangle(Point(0, 0), Point(1, 1))
        mesh = generate_mesh(domain, 16)
        print(f"✓ Created FEniCS mesh with {mesh.num_vertices()} vertices")
        return mesh
    else:
        # Fallback: create simple grid
        x = np.linspace(0, 1, 17)
        y = np.linspace(0, 1, 17)
        X, Y = np.meshgrid(x, y)
        print("✓ Created fallback grid mesh")
        return {'X': X, 'Y': Y}

def solve_laplace_equation():
    """Solve a simple Laplace equation: -∇²u = f"""
    if not FENICS_AVAILABLE:
        print("⚠ FEniCS required for full FEA solving")
        return None

    # Create mesh
    mesh = create_simple_mesh()

    # Define function space
    V = FunctionSpace(mesh, 'P', 1)

    # Define boundary condition
    u_D = Expression('1 + x[0]*x[0] + 2*x[1]*x[1]', degree=2)

    def boundary(x, on_boundary):
        return on_boundary

    bc = DirichletBC(V, u_D, boundary)

    # Define variational problem
    u = TrialFunction(V)
    v = TestFunction(V)
    f = Constant(-6.0)
    a = dot(grad(u), grad(v))*dx
    L = f*v*dx

    # Compute solution
    u = Function(V)
    solve(a == L, u, bc)

    print("✓ Solved Laplace equation using finite elements")
    return u

def visualize_solution(solution=None):
    """Visualize the FEA solution"""
    if solution and FENICS_AVAILABLE:
        # FEniCS plotting
        try:
            plot(solution, title="FEA Solution")
            plt.show()
            print("✓ Plotted FEniCS solution")
        except:
            print("⚠ Could not plot FEniCS solution")
    elif PYVISTA_AVAILABLE:
        # PyVista fallback visualization
        sphere = pv.Sphere()
        sphere.plot(title="FEA Visualization (Demo)")
        print("✓ Created PyVista demo visualization")
    else:
        # Basic matplotlib visualization
        fig = plt.figure(figsize=(10, 8))

        # Create sample data
        x = np.linspace(-1, 1, 100)
        y = np.linspace(-1, 1, 100)
        X, Y = np.meshgrid(x, y)
        Z = np.sin(np.pi * X) * np.cos(np.pi * Y)

        ax = fig.add_subplot(111, projection='3d')
        ax.plot_surface(X, Y, Z, cmap='viridis')
        ax.set_title('Sample FEA Solution Visualization')
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Displacement')

        plt.show()
        print("✓ Created matplotlib visualization")

def run_fea_analysis():
    """Main FEA analysis function"""
    print("🚀 Starting Finite Element Analysis")
    print("=" * 50)

    # Create mesh
    mesh = create_simple_mesh()

    # Solve equation
    solution = solve_laplace_equation()

    # Visualize results
    visualize_solution(solution)

    print("=" * 50)
    print("✅ FEA Analysis Complete")

if __name__ == "__main__":
    run_fea_analysis()