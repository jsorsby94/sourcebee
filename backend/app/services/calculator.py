import ast
import math
from typing import Any

from app.core.errors import AppError

MAX_ABS_VALUE = 1e15
MAX_POWER = 12


class SafeCalculator:
    def evaluate(self, expression: str) -> float:
        try:
            parsed = ast.parse(expression, mode="eval")
        except SyntaxError as exc:
            raise AppError(
                400, "invalid_expression", "Expression syntax is invalid"
            ) from exc

        result = self._eval_node(parsed.body)
        if not math.isfinite(result):
            raise AppError(400, "invalid_expression", "Expression result is not finite")
        if abs(result) > MAX_ABS_VALUE:
            raise AppError(
                400, "invalid_expression", "Expression result is out of allowed range"
            )

        return float(result)

    def _eval_node(self, node: ast.AST) -> float:
        if isinstance(node, ast.Constant):
            if not isinstance(node.value, (int, float)):
                raise AppError(
                    400, "invalid_expression", "Only numeric constants are allowed"
                )
            value = float(node.value)
            if abs(value) > MAX_ABS_VALUE:
                raise AppError(
                    400, "invalid_expression", "Numeric literal is out of allowed range"
                )
            return value

        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = self._eval_node(node.operand)
            return value if isinstance(node.op, ast.UAdd) else -value

        if isinstance(node, ast.BinOp):
            left = self._eval_node(node.left)
            right = self._eval_node(node.right)
            return self._apply_binary_operator(node.op, left, right)

        raise AppError(
            400, "invalid_expression", "Expression contains unsupported operations"
        )

    def _apply_binary_operator(
        self, operator: ast.AST, left: float, right: float
    ) -> float:
        if isinstance(operator, ast.Add):
            return left + right
        if isinstance(operator, ast.Sub):
            return left - right
        if isinstance(operator, ast.Mult):
            return left * right
        if isinstance(operator, ast.Div):
            if right == 0:
                raise AppError(
                    400, "invalid_expression", "Division by zero is not allowed"
                )
            return left / right
        if isinstance(operator, ast.FloorDiv):
            if right == 0:
                raise AppError(
                    400, "invalid_expression", "Division by zero is not allowed"
                )
            return left // right
        if isinstance(operator, ast.Mod):
            if right == 0:
                raise AppError(
                    400, "invalid_expression", "Modulo by zero is not allowed"
                )
            return left % right
        if isinstance(operator, ast.Pow):
            if abs(right) > MAX_POWER:
                raise AppError(
                    400, "invalid_expression", "Exponent is out of allowed range"
                )
            return left**right

        raise AppError(
            400, "invalid_expression", "Expression contains unsupported operators"
        )


def calculate(expression: str) -> dict[str, Any]:
    calculator = SafeCalculator()
    return {"expression": expression, "result": calculator.evaluate(expression)}
