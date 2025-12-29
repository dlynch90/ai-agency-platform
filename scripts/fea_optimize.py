#!/usr/bin/env python3
"""
FEA Optimization Script
Provides design optimization capabilities for finite element analysis
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy import optimize
import time

try:
    import pyomo.environ as pyo
    from pyomo.opt import SolverFactory
    PYOMO_AVAILABLE = True
    print("✓ Pyomo available for optimization")
except ImportError:
    PYOMO_AVAILABLE = False
    print("⚠ Pyomo not available, using scipy optimization")

try:
    import nlopt
    NLOPT_AVAILABLE = True
    print("✓ NLopt available for advanced optimization")
except ImportError:
    NLOPT_AVAILABLE = False
    print("⚠ NLopt not available")

class BeamOptimizer:
    """Beam design optimization class"""

    def __init__(self, length=1.0, load=1000.0, material_props=None):
        self.length = length
        self.load = load
        self.material_props = material_props or {
            'E': 200e9,  # Young's modulus (Pa)
            'rho': 7800,  # Density (kg/m³)
            'yield_strength': 250e6  # Yield strength (Pa)
        }

    def objective_function(self, x):
        """
        Objective: minimize mass
        Variables: [width, height]
        Constraints: stress < yield_strength, deflection < max_deflection
        """
        width, height = x

        # Calculate cross-sectional area
        area = width * height

        # Calculate moment of inertia
        I = width * height**3 / 12

        # Calculate maximum stress (simplified beam theory)
        stress = (self.load * self.length**2) / (8 * I)

        # Calculate deflection
        deflection = (self.load * self.length**3) / (3 * self.material_props['E'] * I)

        # Calculate mass
        volume = area * self.length
        mass = volume * self.material_props['rho']

        # Penalty for constraint violations
        penalty = 0

        # Stress constraint
        if stress > self.material_props['yield_strength']:
            penalty += 1e6 * (stress / self.material_props['yield_strength'] - 1)**2

        # Deflection constraint (assume max deflection = length/100)
        max_deflection = self.length / 100
        if deflection > max_deflection:
            penalty += 1e6 * (deflection / max_deflection - 1)**2

        # Geometric constraints
        if width <= 0 or height <= 0:
            penalty += 1e12

        return mass + penalty

    def stress_constraint(self, x):
        """Stress constraint function"""
        width, height = x
        I = width * height**3 / 12
        stress = (self.load * self.length**2) / (8 * I)
        return self.material_props['yield_strength'] - stress

    def deflection_constraint(self, x):
        """Deflection constraint function"""
        width, height = x
        I = width * height**3 / 12
        deflection = (self.load * self.length**3) / (3 * self.material_props['E'] * I)
        max_deflection = self.length / 100
        return max_deflection - deflection

def scipy_optimization():
    """Perform optimization using SciPy"""
    print("🔬 Running SciPy-based optimization...")

    optimizer = BeamOptimizer()

    # Initial guess
    x0 = [0.01, 0.01]  # [width, height]

    # Bounds
    bounds = [(0.001, 0.1), (0.001, 0.1)]  # Reasonable geometric bounds

    # Constraints
    constraints = [
        {'type': 'ineq', 'fun': optimizer.stress_constraint},
        {'type': 'ineq', 'fun': optimizer.deflection_constraint}
    ]

    # Run optimization
    start_time = time.time()
    result = optimize.minimize(
        optimizer.objective_function,
        x0,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints,
        options={'disp': True, 'maxiter': 1000}
    )
    end_time = time.time()

    print(".4f")
    print(f"Optimal dimensions: width={result.x[0]:.6f}m, height={result.x[1]:.6f}m")
    print(f"Optimal mass: {result.fun:.6f} kg")
    print(f"Success: {result.success}")

    return result

def pyomo_optimization():
    """Perform optimization using Pyomo"""
    if not PYOMO_AVAILABLE:
        print("⚠ Pyomo not available, skipping Pyomo optimization")
        return None

    print("🏗️ Running Pyomo-based optimization...")

    optimizer = BeamOptimizer()

    # Create Pyomo model
    model = pyo.ConcreteModel()

    # Variables
    model.width = pyo.Var(bounds=(0.001, 0.1))
    model.height = pyo.Var(bounds=(0.001, 0.1))

    # Objective
    def objective_rule(model):
        width = model.width
        height = model.height
        area = width * height
        volume = area * optimizer.length
        mass = volume * optimizer.material_props['rho']
        return mass

    model.objective = pyo.Objective(rule=objective_rule, sense=pyo.minimize)

    # Constraints
    def stress_constraint_rule(model):
        width = model.width
        height = model.height
        I = width * height**3 / 12
        stress = (optimizer.load * optimizer.length**2) / (8 * I)
        return stress <= optimizer.material_props['yield_strength']

    def deflection_constraint_rule(model):
        width = model.width
        height = model.height
        I = width * height**3 / 12
        deflection = (optimizer.load * optimizer.length**3) / (3 * optimizer.material_props['E'] * I)
        max_deflection = optimizer.length / 100
        return deflection <= max_deflection

    model.stress_constraint = pyo.Constraint(rule=stress_constraint_rule)
    model.deflection_constraint = pyo.Constraint(rule=deflection_constraint_rule)

    # Solve
    solver = SolverFactory('ipopt')
    start_time = time.time()
    results = solver.solve(model)
    end_time = time.time()

    print(".4f")
    print(f"Optimal dimensions: width={model.width.value:.6f}m, height={model.height.value:.6f}m")
    print(f"Optimal mass: {model.objective():.6f} kg")
    print(f"Solver status: {results.solver.status}")

    return model

def nlopt_optimization():
    """Perform optimization using NLopt"""
    if not NLOPT_AVAILABLE:
        print("⚠ NLopt not available, skipping NLopt optimization")
        return None

    print("⚡ Running NLopt-based optimization...")

    optimizer = BeamOptimizer()

    def objective(x, grad):
        if grad.size > 0:
            # Calculate gradient (finite difference approximation)
            eps = 1e-8
            f0 = optimizer.objective_function(x)
            for i in range(len(x)):
                x_plus = x.copy()
                x_plus[i] += eps
                grad[i] = (optimizer.objective_function(x_plus) - f0) / eps
        return optimizer.objective_function(x)

    # Set up optimization problem
    opt = nlopt.opt(nlopt.LD_SLSQP, 2)  # 2D problem with SLSQP
    opt.set_lower_bounds([0.001, 0.001])
    opt.set_upper_bounds([0.1, 0.1])
    opt.set_min_objective(objective)
    opt.set_xtol_rel(1e-6)

    # Add constraints
    def stress_constraint(x, grad):
        if grad.size > 0:
            eps = 1e-8
            f0 = optimizer.stress_constraint(x)
            for i in range(len(x)):
                x_plus = x.copy()
                x_plus[i] += eps
                grad[i] = (optimizer.stress_constraint(x_plus) - f0) / eps
        return optimizer.stress_constraint(x)

    def deflection_constraint(x, grad):
        if grad.size > 0:
            eps = 1e-8
            f0 = optimizer.deflection_constraint(x)
            for i in range(len(x)):
                x_plus = x.copy()
                x_plus[i] += eps
                grad[i] = (optimizer.deflection_constraint(x_plus) - f0) / eps
        return optimizer.deflection_constraint(x)

    opt.add_inequality_constraint(stress_constraint)
    opt.add_inequality_constraint(deflection_constraint)

    # Initial guess
    x0 = [0.01, 0.01]

    # Run optimization
    start_time = time.time()
    x_opt = opt.optimize(x0)
    end_time = time.time()

    opt_val = opt.last_optimum_value()

    print(".4f")
    print(f"Optimal dimensions: width={x_opt[0]:.6f}m, height={x_opt[1]:.6f}m")
    print(f"Optimal mass: {opt_val:.6f} kg")

    return x_opt, opt_val

def visualize_optimization_history():
    """Visualize the optimization convergence"""
    optimizer = BeamOptimizer()

    # Generate design space
    width_range = np.linspace(0.001, 0.05, 50)
    height_range = np.linspace(0.001, 0.05, 50)
    W, H = np.meshgrid(width_range, height_range)

    # Calculate objective function values
    Z = np.zeros_like(W)
    for i in range(W.shape[0]):
        for j in range(W.shape[1]):
            Z[i, j] = optimizer.objective_function([W[i, j], H[i, j]])

    # Plot
    fig = plt.figure(figsize=(12, 8))

    # 3D surface plot
    ax1 = fig.add_subplot(121, projection='3d')
    surf = ax1.plot_surface(W, H, Z, cmap='viridis', alpha=0.8)
    ax1.set_xlabel('Width (m)')
    ax1.set_ylabel('Height (m)')
    ax1.set_zlabel('Mass (kg)')
    ax1.set_title('Design Space Exploration')
    fig.colorbar(surf, ax=ax1, shrink=0.5)

    # Contour plot
    ax2 = fig.add_subplot(122)
    contour = ax2.contourf(W, H, Z, levels=20, cmap='viridis')
    ax2.set_xlabel('Width (m)')
    ax2.set_ylabel('Height (m)')
    ax2.set_title('Optimization Landscape')
    fig.colorbar(contour, ax=ax2)

    plt.tight_layout()
    plt.show()

def run_optimization():
    """Main optimization function"""
    print("🎯 Starting FEA Design Optimization")
    print("=" * 50)

    results = {}

    # Run different optimization methods
    print("\n1. SciPy Optimization:")
    scipy_result = scipy_optimization()
    results['scipy'] = scipy_result

    print("\n2. Pyomo Optimization:")
    pyomo_result = pyomo_optimization()
    results['pyomo'] = pyomo_result

    print("\n3. NLopt Optimization:")
    nlopt_result = nlopt_optimization()
    results['nlopt'] = nlopt_result

    # Visualize results
    response = input("\n❓ Show optimization landscape visualization? (y/n): ").lower().strip()
    if response == 'y':
        print("\n📊 Creating optimization visualization...")
        visualize_optimization_history()

    print("=" * 50)
    print("✅ FEA Optimization Complete")

    return results

if __name__ == "__main__":
    run_optimization()